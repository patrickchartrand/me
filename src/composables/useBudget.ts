import {
  BudgetConflict,
  computeTotals,
  currentMonth,
  fetchFixed,
  fetchMonth,
  saveMonth,
  today,
} from '@/services/budget'

const NOTES_DELAY = 800

export function useBudget() {
  // Captured once, on purpose — the page reads and writes one month's document.
  // addExpense checks it again, because a tab left open overnight would
  // otherwise file tomorrow's expense under yesterday.
  const month = currentMonth()

  const fixed = ref<FixedBudget | null>(null)
  const expenses = ref<Expense[]>([])
  const notes = ref('')

  const loading = ref(true)
  const saving = ref(false)
  const error = ref<string | null>(null)

  const spent = computed(() => expenses.value.reduce((total, e) => total + e.amount, 0))
  const totals = computed(() => (fixed.value ? computeTotals(fixed.value, expenses.value) : null))
  // Half a cent of slack, matching the rounding the view already applies: an
  // exactly balanced month was showing "-0,00 $" in red.
  const overspent = computed(() => (totals.value ? totals.value.remaining < -0.005 : false))

  onMounted(async () => {
    try {
      const [standing, current] = await Promise.all([fetchFixed(), fetchMonth(month)])
      if (standing === null) {
        throw new Error('les charges fixes sont introuvables dans le stockage privé')
      }
      fixed.value = standing
      expenses.value = current.data.expenses
      notes.value = current.data.notes
      version = current.etag
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'unknown error'
    } finally {
      loading.value = false
    }
  })

  /*
   * Two saves can be in flight at once — delete an expense, then immediately
   * delete another. Without the sequence check the slower response overwrites
   * the newer state and the first expense comes back from the dead.
   */
  let inFlight = 0
  let latest = 0

  /**
   * The version this page last read or wrote. Every save is conditional on it,
   * so a second tab cannot silently overwrite the first: the server refuses and
   * we re-read before trying again.
   */
  let version: string | null = null

  function adopt(snapshot: MonthSnapshot) {
    expenses.value = snapshot.data.expenses
    version = snapshot.etag
  }

  /**
   * `reapply` turns the refusal into a retry. On a conflict the whole-document
   * body we sent is stale by definition, so it is thrown away and the same
   * intent — add this expense, drop that id — is replayed against whatever the
   * server actually holds now. One retry only: a second conflict means two
   * clients are writing faster than this can settle, and the honest answer is
   * to show the server's state and stop.
   *
   * Expense edits can reapply because they are deltas with stable ids. Notes
   * cannot: merging two people's prose produces nonsense, so a notes conflict
   * surfaces instead.
   */
  async function push(
    next: MonthData,
    options: { rollback?: () => void; reapply?: (fresh: MonthData) => MonthData } = {},
  ) {
    // The error is cleared on success, not on entry: clearing it here let a
    // debounced notes save erase a failure the visitor had not read yet.
    const sequence = ++latest
    inFlight++
    saving.value = true
    try {
      let saved: MonthSnapshot
      try {
        saved = await saveMonth(month, next, version)
      } catch (e) {
        if (!(e instanceof BudgetConflict)) throw e
        const fresh = await fetchMonth(month)
        version = fresh.etag
        if (!options.reapply) {
          if (sequence === latest) {
            adopt(fresh)
            notes.value = fresh.data.notes
            error.value = 'ce budget a changé ailleurs — la page a été rechargée'
          }
          return
        }
        saved = await saveMonth(month, options.reapply(fresh.data), version)
      }
      if (sequence === latest) {
        adopt(saved)
        error.value = null
      } else {
        // A newer save is already in flight; keep the version so it can write.
        version = saved.etag
      }
    } catch (e) {
      if (sequence === latest) {
        options.rollback?.()
        error.value = e instanceof Error ? e.message : 'unknown error'
      }
    } finally {
      saving.value = --inFlight > 0
    }
  }

  /** `reapply` replays the same change onto the server's current expenses. */
  function sync(next: Expense[], reapply: (fresh: MonthData) => Expense[]) {
    const previous = expenses.value
    expenses.value = next
    return push(
      { expenses: next, notes: notes.value },
      {
        rollback: () => {
          expenses.value = previous
        },
        // notes come from the server, never from this tab: the conflict means
        // someone else wrote, and their notes must survive an expense edit.
        reapply: (fresh) => ({ expenses: reapply(fresh), notes: fresh.notes }),
      },
    )
  }

  /**
   * Resolves false when the entry was refused, so the caller knows not to clear
   * the form. BudgetView used to read `!error.value` as success, but the
   * validation refusals below never set `error` — a whitespace-only label got
   * past the input's `required`, was dropped here, and took the typed amount
   * with it when the fields were cleared.
   */
  async function addExpense(label: string, amount: number): Promise<boolean> {
    const trimmed = label.trim()
    if (trimmed === '' || !Number.isFinite(amount) || amount <= 0) {
      error.value = 'une dépense a besoin d’un libellé et d’un montant supérieur à zéro'
      return false
    }
    if (currentMonth() !== month) {
      error.value = 'le mois a changé depuis l’ouverture de la page — rechargez-la'
      return false
    }
    const expense: Expense = {
      id: crypto.randomUUID(),
      date: today(),
      label: trimmed,
      amount: Math.round(amount * 100) / 100,
    }
    await sync([...expenses.value, expense], (fresh) => [...fresh.expenses, expense])
    return true
  }

  function removeExpense(id: string) {
    return sync(
      expenses.value.filter((e) => e.id !== id),
      (fresh) => fresh.expenses.filter((e) => e.id !== id),
    )
  }

  function removeAllExpenses() {
    // Clearing the month is absolute: it means every expense, including any the
    // other tab added while this one was open.
    return sync([], () => [])
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  /** True between a keystroke and the debounced save actually firing. */
  let notesPending = false
  function notesChanged() {
    clearTimeout(timer)
    notesPending = true
    timer = setTimeout(() => {
      notesPending = false
      void push({ expenses: expenses.value, notes: notes.value })
    }, NOTES_DELAY)
  }

  function saveNotes() {
    clearTimeout(timer)
    notesPending = false
    return push({ expenses: expenses.value, notes: notes.value })
  }

  function flushNotes() {
    if (!notesPending) return
    clearTimeout(timer)
    notesPending = false
    void push({ expenses: expenses.value, notes: notes.value })
  }

  /*
   * onUnmounted covers an SPA route change, but Vue does not unmount on page
   * unload, and the other flush — @blur — needs focus to move. Closing the tab
   * mid-sentence therefore dropped everything typed inside the 800 ms debounce,
   * which re-arms on every keystroke and so never fires while you are still
   * typing. visibilitychange is the one event that fires reliably on tab close,
   * tab switch and mobile backgrounding, and the page is still alive there, so
   * an ordinary fetch still goes out.
   */
  const onHide = () => {
    if (document.visibilityState === 'hidden') flushNotes()
  }
  onMounted(() => document.addEventListener('visibilitychange', onHide))
  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onHide)
    clearTimeout(timer)
    flushNotes()
  })

  return {
    month,
    fixed,
    expenses,
    notes,
    spent,
    totals,
    overspent,
    loading,
    saving,
    error,
    addExpense,
    removeExpense,
    removeAllExpenses,
    notesChanged,
    saveNotes,
  }
}
