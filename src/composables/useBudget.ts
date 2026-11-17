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
  const month = currentMonth()

  const fixed = ref<FixedBudget | null>(null)
  const expenses = ref<Expense[]>([])
  const notes = ref('')

  const loading = ref(true)
  const saving = ref(false)
  const error = ref<string | null>(null)

  const spent = computed(() => expenses.value.reduce((total, e) => total + e.amount, 0))
  const totals = computed(() => (fixed.value ? computeTotals(fixed.value, expenses.value) : null))
  const overspent = computed(() => (totals.value ? totals.value.remaining < 0 : false))

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

  async function push(next: MonthData, rollback?: () => void) {
    error.value = null
    saving.value = true
    try {
      const saved = await saveMonth(month, next)
      expenses.value = saved.expenses
    } catch (e) {
      rollback?.()
      error.value = e instanceof Error ? e.message : 'unknown error'
    } finally {
      saving.value = false
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
  function notesChanged() {
    clearTimeout(timer)
    timer = setTimeout(
      () => void push({ expenses: expenses.value, notes: notes.value }),
      NOTES_DELAY,
    )
  }

  function saveNotes() {
    clearTimeout(timer)
    return push({ expenses: expenses.value, notes: notes.value })
  }

  onUnmounted(() => clearTimeout(timer))

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
