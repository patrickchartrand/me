import { fileURLToPath, URL } from 'node:url'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'

/**
 * In production, /_/api/budget is a Vercel Function backed by Vercel Blob. None of that exists under `vite dev`: without this plugin the
 * requests fall through to the SPA fallback and come back as index.html.
 *
 * So the same contract is replayed locally against a plain JSON file. Local
 * data stays separate from production on purpose — experiments here never
 * touch the real budget. `apply: 'serve'` keeps this out of every build.
 */
function budgetApiDevServer(): Plugin {
  const FILE = fileURLToPath(new URL('./node_modules/.tmp/budget-dev.json', import.meta.url))
  const VALID_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

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
    personal: { label: string; amount: number; note?: string; savings?: boolean }[]
    shared: { label: string; total: number; share: number; note?: string }[]
  }

  interface Store {
    fixed?: FixedBudget
    months?: Record<string, { expenses: unknown[]; notes: string; etag?: string }>
  }

  /**
   * Obviously-fake standing commitments, so the page is usable under `vite dev`.
   *
   * Production reads the real figures from Vercel Blob; they are never written to
   * disk here, and nothing local can reach them. Before this existed the dev page
   * only ever showed "les charges fixes sont introuvables" — the seeding screen
   * that used to fill the gap is gone, deliberately, since the commitments are
   * now read-only.
   *
   * Round numbers and placeholder labels on purpose: nobody should be able to
   * mistake this for a real budget, or report a bug against its arithmetic.
   */
  const SAMPLE: FixedBudget = {
    updatedAt: '2026-01-01',
    income: {
      weeklyNet: 1000,
      weeklyGross: 1400,
      weeklyDeductions: 400,
      weeklyHours: 35,
      hourlyRate: 40,
      payday: 'Thursday',
    },
    personal: [
      { label: 'Sample rent', amount: 1200 },
      { label: 'Sample car payment', amount: 400 },
      { label: 'Sample phone', amount: 50 },
      { label: 'Sample savings', amount: 300, savings: true },
    ],
    shared: [
      { label: 'Sample groceries', total: 800, share: 400 },
      { label: 'Sample utilities', total: 200, share: 100 },
    ],
  }

  const read = (): Store => {
    try {
      const store = JSON.parse(readFileSync(FILE, 'utf8')) as Store
      return { ...store, fixed: store.fixed ?? SAMPLE }
    } catch {
      return { fixed: SAMPLE }
    }
  }
  const write = (store: Store) => {
    mkdirSync(dirname(FILE), { recursive: true })
    writeFileSync(FILE, JSON.stringify(store, null, 2))
  }

  const body = (request: { on: (e: string, cb: (chunk: Buffer) => void) => void }) =>
    new Promise<unknown>((resolve) => {
      const chunks: Buffer[] = []
      request.on('data', (chunk) => chunks.push(chunk))
      request.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString()))
        } catch {
          resolve(null)
        }
      })
    })

  return {
    name: 'budget-api-dev',
    apply: 'serve',
    configureServer(server) {
      const json =
        (response: {
          statusCode: number
          setHeader: (n: string, v: string) => void
          end: (s: string) => void
        }) =>
        (data: unknown, code = 200) => {
          response.statusCode = code
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.setHeader('Cache-Control', 'no-store')
          response.end(JSON.stringify(data))
        }

      server.middlewares.use('/_/api/budget', (request, response) => {
        const reply = json(response)
        const url = new URL(request.url ?? '/', 'http://localhost')
        const scope = url.searchParams.get('scope')

        // Read-only, matching production: nothing writes the standing commitments.
        if (scope === 'fixed') {
          if (request.method === 'GET') {
            const stored = read().fixed
            return reply(stored == null ? { empty: true } : stored)
          }
          return reply({ error: 'Method not allowed.' }, 405)
        }

        if (scope === 'month') {
          const month = url.searchParams.get('month')
          if (!month || !VALID_MONTH.test(month)) {
            return reply({ error: 'Expected a "month" parameter formatted as YYYY-MM.' }, 400)
          }

          if (request.method === 'GET') {
            const stored = read().months?.[month]
            // Mirrors production: no document yet means no version, and the
            // client's first write is then conditional on it still being absent.
            if (stored?.etag) response.setHeader('ETag', stored.etag)
            return reply({ month, expenses: stored?.expenses ?? [], notes: stored?.notes ?? '' })
          }
          if (request.method === 'PUT') {
            void body(request).then((received) => {
              // Same refusal as production: a malformed body must not quietly
              // overwrite the month with an empty one.
              if (typeof received !== 'object' || received === null || Array.isArray(received)) {
                return reply({ error: 'Expected a JSON object.' }, 400)
              }
              const data = received as { expenses?: unknown[]; notes?: string }
              const store = read()
              const current = store.months?.[month]
              /*
               * The same optimistic-concurrency check the Blob store performs in
               * production. Without it here the conflict path would be
               * unreachable under `vite dev` and so never exercised.
               */
              const sent = request.headers['if-match']
              const expected = current?.etag ?? null
              const given = typeof sent === 'string' && sent !== '' ? sent : null
              if (given !== expected) {
                return reply(
                  { error: 'Ce budget a changé ailleurs depuis son chargement.', conflict: true },
                  412,
                )
              }
              const entry = {
                expenses: data.expenses ?? [],
                notes: data.notes ?? '',
                etag: `"dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}"`,
              }
              store.months = { ...store.months, [month]: entry }
              write(store)
              response.setHeader('ETag', entry.etag)
              reply({ month, expenses: entry.expenses, notes: entry.notes })
            })
            return
          }
          return reply({ error: 'Method not allowed.' }, 405)
        }

        return reply({ error: 'Expected a "scope" parameter of "fixed" or "month".' }, 400)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    budgetApiDevServer(),
    tailwindcss(),
    vue(),
    vueDevTools(),
    AutoImport({
      imports: ['vue', 'vue-i18n', 'vue-router', { '@unhead/vue': ['useHead'] }],
      dirs: ['src/composables'],
      dts: 'src/types/auto-imports.d.ts',
      vueTemplate: true,
    }),
    Components({
      dirs: ['src/components'],
      dts: 'src/types/components.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
