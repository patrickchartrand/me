import { PRIVATE_PREFIX } from '@/config'

export interface Expense {
  id: string
  /** YYYY-MM-DD */
  date: string
  label: string
  amount: number
}

/** What changes from one month to the next. */
export interface MonthData {
  expenses: Expense[]
  notes: string
}

export interface PersonalItem {
  label: string
  amount: number
  note?: string
  savings?: boolean
}

export interface SharedItem {
  label: string
  total: number
  share: number
  note?: string
}

/** The standing commitments. Stored privately, never in this repository. */
export interface FixedBudget {
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

export interface Totals {
  personal: number
  shared: number
  committed: number
  monthlyIncome: number
  remaining: number
  savings: number
  actualSpending: number
}

const API = `${PRIVATE_PREFIX}/api/budget`

export const EMPTY_MONTH: MonthData = { expenses: [], notes: '' }

/** Current month as YYYY-MM — the key the data is stored under. */
export function currentMonth(reference = new Date()): string {
  const month = String(reference.getMonth() + 1).padStart(2, '0')
  return `${reference.getFullYear()}-${month}`
}

export function today(reference = new Date()): string {
  const month = String(reference.getMonth() + 1).padStart(2, '0')
  const day = String(reference.getDate()).padStart(2, '0')
  return `${reference.getFullYear()}-${month}-${day}`
}

const sum = (values: number[]) => values.reduce((total, n) => total + n, 0)

/** Everything is recomputed from the rows — no total is ever copied. */
export function computeTotals(fixed: FixedBudget, expenses: Expense[]): Totals {
  const personal = sum(fixed.personal.map((i) => i.amount))
  const shared = sum(fixed.shared.map((i) => i.share))
  const committed = personal + shared
  const monthlyIncome = (fixed.income.weeklyNet * 52) / 12
  const savings = sum(fixed.personal.filter((i) => i.savings).map((i) => i.amount))
  const spent = sum(expenses.map((e) => e.amount))

  return {
    personal,
    shared,
    committed,
    monthlyIncome,
    remaining: monthlyIncome - committed - spent,
    savings,
    actualSpending: committed - savings,
  }
}

export class BudgetUnavailable extends Error {
  constructor(reason: string) {
    super(reason)
    this.name = 'BudgetUnavailable'
  }
}

async function readBody<T>(response: Response): Promise<T> {
  // The SPA fallback answers 200 with index.html when a route is missing.
  const type = response.headers.get('Content-Type') ?? ''
  if (!type.includes('json')) {
    throw new BudgetUnavailable(
      `the server returned ${type.split(';')[0] || 'an unknown content type'} instead of JSON`,
    )
  }
  const body = (await response.json()) as T & { error?: string }
  if (!response.ok) {
    throw new BudgetUnavailable(body.error ?? `the server answered ${response.status}`)
  }
  return body
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, { cache: 'no-store', ...init })
  } catch (e) {
    throw new BudgetUnavailable(
      e instanceof Error ? `request failed (${e.message})` : 'request failed',
    )
  }
  return readBody<T>(response)
}

const asJson = (value: unknown): RequestInit => ({
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(value),
})

export async function fetchMonth(month: string): Promise<MonthData> {
  const body = await request<Partial<MonthData>>(`${API}?scope=month&month=${month}`)
  return { expenses: body.expenses ?? [], notes: body.notes ?? '' }
}

export async function saveMonth(month: string, data: MonthData): Promise<MonthData> {
  const body = await request<Partial<MonthData>>(`${API}?scope=month&month=${month}`, asJson(data))
  return { expenses: body.expenses ?? [], notes: body.notes ?? '' }
}

/** Resolves to `null` when nothing has been seeded yet. */
export async function fetchFixed(): Promise<FixedBudget | null> {
  const body = await request<FixedBudget & { empty?: boolean }>(`${API}?scope=fixed`)
  return body.empty ? null : body
}

export async function saveFixed(data: FixedBudget): Promise<FixedBudget> {
  return request<FixedBudget>(`${API}?scope=fixed`, asJson(data))
}
