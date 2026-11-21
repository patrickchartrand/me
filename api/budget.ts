import { BlobPreconditionFailedError, get, put } from '@vercel/blob'
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
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
const rows = (raw: unknown): Record<string, unknown>[] =>
  Array.isArray(raw)
    ? raw.filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null)
    : []

function cleanMonth(raw: unknown): MonthData {
  const source = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  return {
    expenses: rows(source.expenses)
      .map((expense) => ({
        id: text(expense.id, 64),
        date: text(expense.date, 10),
        label: text(expense.label),
        amount: Number(expense.amount),
      }))
      .filter(
        (expense) =>
          expense.id !== '' &&
          expense.label !== '' &&
          VALID_DATE.test(expense.date) &&
          Number.isFinite(expense.amount),
      )
      .slice(0, MAX_EXPENSES),
    notes: typeof source.notes === 'string' ? source.notes.slice(0, MAX_NOTES) : '',
  }
}

function cleanFixed(raw: unknown): FixedBudget {
  const source = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  const income = (
    typeof source.income === 'object' && source.income !== null ? source.income : {}
  ) as Record<string, unknown>
  return {
    updatedAt: text(source.updatedAt, 10),
    income: {
      weeklyNet: num(income.weeklyNet),
      weeklyGross: num(income.weeklyGross),
      weeklyDeductions: num(income.weeklyDeductions),
      weeklyHours: num(income.weeklyHours),
      hourlyRate: num(income.hourlyRate),
      payday: text(income.payday, 40),
    },
    personal: rows(source.personal)
      .map((item) => ({
        label: text(item.label),
        amount: num(item.amount),
        ...(item.note ? { note: text(item.note) } : {}),
        ...(item.savings ? { savings: true } : {}),
      }))
      .filter((item) => item.label !== '')
      .slice(0, MAX_ITEMS),
    shared: rows(source.shared)
      .map((item) => ({
        label: text(item.label),
        total: num(item.total),
        share: num(item.share),
        ...(item.note ? { note: text(item.note) } : {}),
      }))
      .filter((item) => item.label !== '')
      .slice(0, MAX_ITEMS),
  }
}

interface StoredJson {
  data: unknown | null
  etag: string | null
}

async function readJson(pathname: string, token: string): Promise<StoredJson> {
  const result = await get(pathname, { access: 'private', useCache: false, token })
  if (!result?.stream) return { data: null, etag: null }
  const raw = result.blob?.etag
  const etag = typeof raw === 'string' && raw !== '' ? raw : null
  try {
    return { data: JSON.parse(await new Response(result.stream).text()), etag }
  } catch {
    return { data: null, etag }
  }
}

async function writeJson(
  pathname: string,
  value: unknown,
  token: string,
  ifMatch: string | null,
): Promise<string> {
  const result = await put(pathname, JSON.stringify(value), {
    access: 'private',
    contentType: 'application/json',
    token,
    ...(ifMatch === null ? { allowOverwrite: false } : { allowOverwrite: true, ifMatch }),
  })
  return result.etag
}

async function isLostRace(
  cause: unknown,
  pathname: string,
  token: string,
  conditional: boolean,
): Promise<boolean> {
  if (cause instanceof BlobPreconditionFailedError) return true
  if (conditional) return false
  try {
    return (await readJson(pathname, token)).etag !== null
  } catch {
    return false
  }
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
const VALID_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

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
    if (scope === 'fixed') {
      if (method === 'GET') {
        const { data } = await readJson('budget/fixed.json', token)
        return reply(200, data === null ? { empty: true } : cleanFixed(data))
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
        const { data, etag } = await readJson(pathname, token)
        if (etag !== null) response.setHeader('ETag', etag)
        return reply(200, { month, ...cleanMonth(data) })
      }
      if (method === 'PUT') {
        if (
          typeof request.body !== 'object' ||
          request.body === null ||
          Array.isArray(request.body)
        ) {
          return reply(400, { error: 'Expected a JSON object.' })
        }
        const data = cleanMonth(request.body)
        const header = request.headers['if-match']
        const ifMatch = typeof header === 'string' && header !== '' ? header : null
        try {
          response.setHeader('ETag', await writeJson(pathname, data, token, ifMatch))
        } catch (e) {
          if (!(await isLostRace(e, pathname, token, ifMatch !== null))) throw e
          return reply(412, {
            error: 'This month changed elsewhere since it was read.',
            conflict: true,
          })
        }
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
