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
  const month = currentMonth()

  const fixed = ref<FixedBudget | null>(null)
  const expenses = ref<Expense[]>([])
  const notes = ref('')

  const loading = ref(true)
  const saving = ref(false)
  const error = ref<string | null>(null)

  const spent = computed(() => expenses.value.reduce((total, expense) => total + expense.amount, 0))
  const totals = computed(() => (fixed.value ? computeTotals(fixed.value, expenses.value) : null))
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

  let inFlight = 0
  let latest = 0

  let queue: Promise<void> = Promise.resolve()
  let inQueue = 0
  const serialise = (work: () => Promise<void>): Promise<void> => {
    inQueue++
    const done = () => {
      inQueue--
    }
    const next = inQueue === 1 ? work().finally(done) : queue.then(work, work).finally(done)
    queue = next.catch(() => {})
    return next
  }

  let version: string | null = null

  function adopt(snapshot: MonthSnapshot) {
    expenses.value = snapshot.data.expenses
    version = snapshot.etag
  }

  interface PushOptions {
    rollback?: () => void
    reapply?: (fresh: MonthData) => MonthData
    keepalive?: boolean
  }

  function push(next: MonthData, options: PushOptions = {}): Promise<void> {
    return serialise(() => write(next, options))
  }

  const CHANGED_ELSEWHERE = 'ce budget a changé ailleurs — la page a été rechargée'

  function reconcileNotes(serverNotes: string): boolean {
    if (serverNotes === notes.value) return false
    notes.value = serverNotes
    notesPending = false
    clearTimeout(timer)
    return true
  }

  async function write(next: MonthData, options: PushOptions) {
    const sequence = ++latest
    inFlight++
    saving.value = true
    try {
      let saved: MonthSnapshot
      let changedElsewhere = false
      try {
        saved = await saveMonth(month, next, version, options.keepalive)
      } catch (e) {
        if (!(e instanceof BudgetConflict)) throw e
        const fresh = await fetchMonth(month)
        version = fresh.etag
        if (!options.reapply) {
          if (sequence === latest) {
            adopt(fresh)
            reconcileNotes(fresh.data.notes)
            error.value = CHANGED_ELSEWHERE
          }
          return
        }
        changedElsewhere = true
        saved = await saveMonth(month, options.reapply(fresh.data), version)
      }
      if (sequence === latest) {
        adopt(saved)
        const notesMoved = changedElsewhere && reconcileNotes(saved.data.notes)
        error.value = notesMoved
          ? CHANGED_ELSEWHERE
          : error.value === CHANGED_ELSEWHERE
            ? error.value
            : null
      } else {
        version = saved.etag
      }
    } catch (e) {
      if (sequence === latest) {
        if (e instanceof BudgetConflict) {
          try {
            const fresh = await fetchMonth(month)
            version = fresh.etag
            adopt(fresh)
            reconcileNotes(fresh.data.notes)
          } catch {
            options.rollback?.()
          }
          error.value = CHANGED_ELSEWHERE
        } else {
          options.rollback?.()
          error.value = e instanceof Error ? e.message : 'unknown error'
        }
      }
    } finally {
      saving.value = --inFlight > 0
    }
  }

  function sync(next: Expense[], reapply: (fresh: MonthData) => Expense[]) {
    const previous = expenses.value
    expenses.value = next
    return push(
      { expenses: next, notes: notes.value },
      {
        rollback: () => {
          expenses.value = previous
        },
        reapply: (fresh) => ({ expenses: reapply(fresh), notes: fresh.notes }),
      },
    )
  }

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
    await sync([...expenses.value, expense], (fresh) =>
      fresh.expenses.some((stored) => stored.id === expense.id)
        ? fresh.expenses
        : [...fresh.expenses, expense],
    )
    return true
  }

  function removeExpense(id: string) {
    return sync(
      expenses.value.filter((expense) => expense.id !== id),
      (fresh) => fresh.expenses.filter((expense) => expense.id !== id),
    )
  }

  function removeAllExpenses() {
    return sync([], () => [])
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  let notesPending = false
  function notesChanged() {
    if (error.value === CHANGED_ELSEWHERE) error.value = null
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

  function flushNotes(keepalive = false) {
    if (!notesPending) return
    clearTimeout(timer)
    notesPending = false
    void push({ expenses: expenses.value, notes: notes.value }, { keepalive })
  }

  const onHide = () => {
    if (document.visibilityState === 'hidden') flushNotes(true)
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
