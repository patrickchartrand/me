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

  interface Store {
    fixed?: unknown
    months?: Record<string, { expenses: unknown[]; notes: string }>
  }

  const read = (): Store => {
    try {
      return JSON.parse(readFileSync(FILE, 'utf8')) as Store
    } catch {
      return {}
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
        (response: { statusCode: number; setHeader: (n: string, v: string) => void; end: (s: string) => void }) =>
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
            return reply({ month, expenses: stored?.expenses ?? [], notes: stored?.notes ?? '' })
          }
          if (request.method === 'PUT') {
            void body(request).then((received) => {
              const data = (received ?? {}) as { expenses?: unknown[]; notes?: string }
              const entry = { expenses: data.expenses ?? [], notes: data.notes ?? '' }
              const store = read()
              store.months = { ...store.months, [month]: entry }
              write(store)
              reply({ month, ...entry })
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
