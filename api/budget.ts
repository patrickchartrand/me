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
      // `date` was only length-capped, so any ten characters were accepted and
      // stored as one. The types promise YYYY-MM-DD; this is what enforces it.
      .filter(
        (e) =>
          e.id !== '' && e.label !== '' && VALID_DATE.test(e.date) && Number.isFinite(e.amount),
      )
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

/**
 * The ETag comes back with the document because every write is conditional on
 * it. `etag` is null when the blob does not exist yet, which is a real state —
 * a month nobody has saved into — and the caller's first write is then
 * conditional on it still not existing.
 */
interface StoredJson {
  data: unknown | null
  etag: string | null
}

async function readJson(pathname: string, token: string): Promise<StoredJson> {
  const result = await get(pathname, { access: 'private', useCache: false, token })
  if (!result?.stream) return { data: null, etag: null }
  const etag = typeof result.blob?.etag === 'string' ? result.blob.etag : null
  try {
    return { data: JSON.parse(await new Response(result.stream).text()), etag }
  } catch {
    return { data: null, etag }
  }
}

/**
 * Returns the ETag of what was just written, so the caller can keep writing.
 * With no ifMatch the write is create-only: that is the first save of a month,
 * and it must still lose if another client created the document meanwhile.
 */
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

/**
 * Did this write lose a race rather than fail outright?
 *
 * With an ifMatch the library says so with a typed error. Without one — the
 * create-only first save of a month — the refusal comes from the remote Blob
 * API, and the SDK ships no message for it: `already exists` appears nowhere in
 * the package, because `x-allow-overwrite` is just a header the server decides
 * on. Matching its wording would be betting on a string nothing promises, so
 * this asks the store instead: if the document is there now, someone created it
 * while we were writing, and that is the same lost race.
 */
async function isLostRace(
  e: unknown,
  pathname: string,
  token: string,
  conditional: boolean,
): Promise<boolean> {
  if (e instanceof BlobPreconditionFailedError) return true
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
    // Read-only on purpose. The standing commitments are written to private
    // storage out of band; no caller here can overwrite them, so a stolen
    // session cannot rewrite the budget itself — only the month's expenses.
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
        // cleanMonth turns anything unrecognisable into an empty month, so
        // without this guard a malformed body overwrote the real document and
        // answered 200. Refuse instead of erasing.
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
          /*
           * The document moved under this client — another tab or device wrote
           * it between their read and this write. Refusing is the whole point:
           * the body they sent is a full month assembled from a stale snapshot,
           * so applying it would silently erase whatever the other write added.
           */
          return reply(412, {
            error: 'Ce budget a changé ailleurs depuis son chargement.',
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
