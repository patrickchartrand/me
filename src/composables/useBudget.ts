import {
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
      expenses.value = current.expenses
      notes.value = current.notes
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
  async function push(next: MonthData, rollback?: () => void) {
    // The error is cleared on success, not on entry: clearing it here let a
    // debounced notes save erase a failure the visitor had not read yet.
    const sequence = ++latest
    inFlight++
    saving.value = true
    try {
      const saved = await saveMonth(month, next)
      if (sequence === latest) {
        expenses.value = saved.expenses
        error.value = null
      }
    } catch (e) {
      if (sequence === latest) {
        rollback?.()
        error.value = e instanceof Error ? e.message : 'unknown error'
      }
    } finally {
      saving.value = --inFlight > 0
    }
  }

  function sync(next: Expense[]) {
    const previous = expenses.value
    expenses.value = next
    return push({ expenses: next, notes: notes.value }, () => {
      expenses.value = previous
    })
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
    await sync([...expenses.value, expense])
    return true
  }

  function removeExpense(id: string) {
    return sync(expenses.value.filter((e) => e.id !== id))
  }

  function removeAllExpenses() {
    return sync([])
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
