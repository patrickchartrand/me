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
    error.value = null
    const sequence = ++latest
    inFlight++
    saving.value = true
    try {
      const saved = await saveMonth(month, next)
      if (sequence === latest) expenses.value = saved.expenses
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

  function addExpense(label: string, amount: number) {
    const trimmed = label.trim()
    if (trimmed === '' || !Number.isFinite(amount) || amount <= 0) return
    if (currentMonth() !== month) {
      error.value = 'le mois a changé depuis l’ouverture de la page — rechargez-la'
      return
    }
    const expense: Expense = {
      id: crypto.randomUUID(),
      date: today(),
      label: trimmed,
      amount: Math.round(amount * 100) / 100,
    }
    return sync([...expenses.value, expense])
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

  // Anything typed inside the debounce window was lost on the way out.
  onUnmounted(() => {
    clearTimeout(timer)
    if (notesPending) void push({ expenses: expenses.value, notes: notes.value })
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
