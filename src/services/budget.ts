import { PRIVATE_PREFIX } from '@/router'

const API = `${PRIVATE_PREFIX}/api/budget`

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

export function computeTotals(fixed: FixedBudget, expenses: Expense[]): Totals {
  const personal = sum(fixed.personal.map((i) => i.amount))
  const shared = sum(fixed.shared.map((i) => i.share))
  const committed = personal + shared
  const monthlyIncome = (fixed.income.weeklyNet * 52) / 12
  const spent = sum(expenses.map((e) => e.amount))

  return {
    personal,
    shared,
    committed,
    monthlyIncome,
    remaining: monthlyIncome - committed - spent,
  }
}

class BudgetUnavailable extends Error {
  constructor(reason: string) {
    super(reason)
    this.name = 'BudgetUnavailable'
  }
}

async function readBody<T>(response: Response): Promise<T> {
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

export async function fetchFixed(): Promise<FixedBudget | null> {
  const body = await request<FixedBudget & { empty?: boolean }>(`${API}?scope=fixed`)
  return body.empty ? null : body
}
