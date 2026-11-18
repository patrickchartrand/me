import { get, put } from '@vercel/blob'
import { createRemoteJWKSet, jwtVerify } from 'jose'

const TEAM_DOMAIN = 'https://yellow-dawn-11c1.cloudflareaccess.com'
const AUDIENCE = '31a91272a86f7ee28d62885ba013f741997b535ded994e44960fb6525670008e'

const accessKeys = createRemoteJWKSet(new URL(`${TEAM_DOMAIN}/cdn-cgi/access/certs`))

async function isAuthenticated(assertion: unknown): Promise<boolean> {
  if (typeof assertion !== 'string' || assertion === '') return false
  try {
    await jwtVerify(assertion, accessKeys, { issuer: TEAM_DOMAIN, audience: AUDIENCE })
    return true
  } catch {
    return false
  }
}

interface Expense {
  id: string
  /** YYYY-MM-DD */
  date: string
  label: string
  amount: number
}

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

const MAX_EXPENSES = 500
const MAX_ITEMS = 100
const MAX_LABEL = 120
const MAX_NOTES = 20_000

const text = (value: unknown, max = MAX_LABEL) => String(value ?? '').slice(0, max)
const num = (value: unknown) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}
const rows = (raw: unknown): Record<string, unknown>[] =>
  Array.isArray(raw)
    ? raw.filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    : []

function cleanMonth(raw: unknown): MonthData {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  return {
    expenses: rows(o.expenses)
      .map((e) => ({
        id: text(e.id, 64),
        date: text(e.date, 10),
        label: text(e.label),
        amount: Number(e.amount),
      }))
      .filter((e) => e.id !== '' && e.label !== '' && Number.isFinite(e.amount))
      .slice(0, MAX_EXPENSES),
    notes: typeof o.notes === 'string' ? o.notes.slice(0, MAX_NOTES) : '',
  }
}

function cleanFixed(raw: unknown): FixedBudget {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  const income = (typeof o.income === 'object' && o.income !== null ? o.income : {}) as Record<
    string,
    unknown
  >
  return {
    updatedAt: text(o.updatedAt, 10),
    income: {
      weeklyNet: num(income.weeklyNet),
      weeklyGross: num(income.weeklyGross),
      weeklyDeductions: num(income.weeklyDeductions),
      weeklyHours: num(income.weeklyHours),
      hourlyRate: num(income.hourlyRate),
      payday: text(income.payday, 40),
    },
    personal: rows(o.personal)
      .map((i) => ({
        label: text(i.label),
        amount: num(i.amount),
        ...(i.note ? { note: text(i.note) } : {}),
        ...(i.savings ? { savings: true } : {}),
      }))
      .filter((i) => i.label !== '')
      .slice(0, MAX_ITEMS),
    shared: rows(o.shared)
      .map((i) => ({
        label: text(i.label),
        total: num(i.total),
        share: num(i.share),
        ...(i.note ? { note: text(i.note) } : {}),
      }))
      .filter((i) => i.label !== '')
      .slice(0, MAX_ITEMS),
  }
}

async function readJson(pathname: string, token: string): Promise<unknown | null> {
  const result = await get(pathname, { access: 'private', useCache: false, token })
  if (!result?.stream) return null
  try {
    return JSON.parse(await new Response(result.stream).text())
  } catch {
    return null
  }
}

async function writeJson(pathname: string, value: unknown, token: string): Promise<void> {
  await put(pathname, JSON.stringify(value), {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json',
    token,
  })
}

interface ApiRequest {
  method?: string
  headers: Record<string, string | string[] | undefined>
  query: Record<string, string | string[] | undefined>
  body?: unknown
}

interface ApiResponse {
  status: (code: number) => ApiResponse
  setHeader: (name: string, value: string) => void
  json: (body: unknown) => void
}

const VALID_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

export default async function handler(request: ApiRequest, response: ApiResponse) {
  const reply = (code: number, body: unknown) => {
    response.setHeader('Cache-Control', 'no-store')
    response.status(code).json(body)
  }

  if (!(await isAuthenticated(request.headers['cf-access-jwt-assertion']))) {
    return reply(401, { error: 'Authentication required.' })
  }

  const token = process.env.DB_READ_WRITE_TOKEN
  if (!token) {
    return reply(503, { error: 'DB_READ_WRITE_TOKEN is not configured.' })
  }

  const scope = request.query.scope
  const method = request.method

  try {
    // Read-only on purpose. The standing commitments are written to private
    // storage out of band; no caller here can overwrite them, so a stolen
    // session cannot rewrite the budget itself — only the month's expenses.
    if (scope === 'fixed') {
      if (method === 'GET') {
        const stored = await readJson('budget/fixed.json', token)
        return reply(200, stored === null ? { empty: true } : cleanFixed(stored))
      }
      return reply(405, { error: 'Method not allowed.' })
    }

    if (scope === 'month') {
      const month = request.query.month
      if (typeof month !== 'string' || !VALID_MONTH.test(month)) {
        return reply(400, { error: 'Expected a "month" parameter formatted as YYYY-MM.' })
      }
      const pathname = `budget/${month}.json`

      if (method === 'GET') {
        return reply(200, { month, ...cleanMonth(await readJson(pathname, token)) })
      }
      if (method === 'PUT') {
        const data = cleanMonth(request.body)
        await writeJson(pathname, data, token)
        return reply(200, { month, ...data })
      }
      return reply(405, { error: 'Method not allowed.' })
    }
  } catch (e) {
    return reply(502, {
      error: e instanceof Error ? `storage unavailable (${e.message})` : 'storage unavailable',
    })
  }

  return reply(400, { error: 'Expected a "scope" parameter of "fixed" or "month".' })
}
