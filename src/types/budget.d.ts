interface Expense {
  id: string
  date: string /** YYYY-MM-DD */
  label: string
  amount: number
}

interface MonthData {
  expenses: Expense[]
  notes: string
}

interface MonthSnapshot {
  data: MonthData
  etag: string | null
}

interface PersonalItem {
  label: string
  amount: number
  note?: string
  savings?: boolean
}

interface SharedItem {
  label: string
  total: number
  share: number
  note?: string
}

interface FixedBudget {
  updatedAt: string
  income: {
    weeklyNet: number
    weeklyGross: number
    weeklyDeductions: number
    weeklyHours: number
    hourlyRate: number
    payday: string
  }
  personal: PersonalItem[]
  shared: SharedItem[]
}

interface Totals {
  personal: number
  shared: number
  committed: number
  monthlyIncome: number
  remaining: number
}
