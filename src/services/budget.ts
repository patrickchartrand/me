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

/**
 * The server refused the write because the month moved since it was read —
 * another tab or device saved in between. Separate from BudgetUnavailable
 * because it is recoverable: re-read, re-apply, write again.
 */
export class BudgetConflict extends Error {
  constructor() {
    super('ce budget a changé ailleurs depuis son chargement')
    this.name = 'BudgetConflict'
  }
}

async function readBody<T>(response: Response): Promise<T> {
  if (response.status === 412) throw new BudgetConflict()
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

/** The ETag travels beside the body: callers need the version, not just the data. */
async function request<T>(
  url: string,
  init?: RequestInit,
): Promise<{ body: T; etag: string | null }> {
  let response: Response
  try {
    response = await fetch(url, { cache: 'no-store', ...init })
  } catch (e) {
    throw new BudgetUnavailable(
      e instanceof Error ? `request failed (${e.message})` : 'request failed',
    )
  }
  return { body: await readBody<T>(response), etag: response.headers.get('ETag') }
}

const asJson = (value: unknown, etag: string | null): RequestInit => ({
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    // Absent for a month with no document yet; the server then writes only if
    // one still does not exist.
    ...(etag === null ? {} : { 'If-Match': etag }),
  },
  body: JSON.stringify(value),
})

const asMonth = (body: Partial<MonthData>): MonthData => ({
  expenses: body.expenses ?? [],
  notes: body.notes ?? '',
})

export async function fetchMonth(month: string): Promise<MonthSnapshot> {
  const { body, etag } = await request<Partial<MonthData>>(`${API}?scope=month&month=${month}`)
  return { data: asMonth(body), etag }
}

/** Throws BudgetConflict when `etag` is no longer the current version. */
export async function saveMonth(
  month: string,
  data: MonthData,
  etag: string | null,
): Promise<MonthSnapshot> {
  const { body, etag: next } = await request<Partial<MonthData>>(
    `${API}?scope=month&month=${month}`,
    asJson(data, etag),
  )
  return { data: asMonth(body), etag: next }
}

export async function fetchFixed(): Promise<FixedBudget | null> {
  const { body } = await request<FixedBudget & { empty?: boolean }>(`${API}?scope=fixed`)
  return body.empty ? null : body
}
