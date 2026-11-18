/**
 * Domain types for the private budget page.
 *
 * Ambient on purpose: this file declares no import and no export, so TypeScript
 * treats it as a global script and every file under src/ sees these names
 * without an import line.
 *
 * api/budget.ts deliberately repeats them instead of using these. It is a Vercel
 * Function compiled outside this project's tsconfig — `api/` appears in no
 * `include` — so a name it could only get from here would resolve locally and
 * fail at deploy time. That file stays self-contained, which is also why it has
 * no relative imports at all.
 */

interface Expense {
  id: string
  /** YYYY-MM-DD */
  date: string
  label: string
  amount: number
}

/** What changes from one month to the next. */
interface MonthData {
  expenses: Expense[]
  notes: string
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

/** The standing commitments. Stored privately, never in this repository. */
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
