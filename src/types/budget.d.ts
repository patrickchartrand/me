/**
 * Domain types for the private budget page.
 *
 * Ambient on purpose: this file declares no import and no export, so TypeScript
 * treats it as a global script and every file under src/ sees these names
 * without an import line.
 *
 * api/budget.ts deliberately repeats them instead of using these. Vercel
 * compiles that file on its own, without this project's tsconfig, so a name it
 * could only get from here would resolve locally and fail at deploy time. It
 * stays self-contained, which is also why it has no relative imports at all.
 * (tsconfig.node.json does include `api/**` now, but only so vue-tsc checks the
 * file — it says nothing about how Vercel builds it.)
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

/**
 * A month together with the version it was read at. Every write is conditional
 * on that version, so two tabs cannot overwrite each other: the second one is
 * refused instead of silently winning. `etag` is null for a month nobody has
 * saved into yet, and that absence is itself the precondition — the first write
 * must fail if someone else created the document meanwhile.
 */
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
