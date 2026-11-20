# Patrick Chartrand — portfolio

The source of [patrickchartrand.dev](https://patrickchartrand.dev): a single-page
portfolio in French and English, plus a private budget page that rides along in
the same build.

## Stack

- **Vue 3.5** single-file components, `<script setup>`, TypeScript throughout
- **Vite 7**, with composables and components auto-imported — the generated
  declarations live in `src/types/` and are rewritten on every build, so they
  are never edited by hand
- **Tailwind CSS v4** through `@tailwindcss/vite`; the palette, breakpoints and
  the few hand-written rules all sit in `src/assets/style.css`
- **vue-i18n** for the French and English copy, **vue-router** for the two
  routes, **@unhead/vue** for metadata that follows the chosen locale
- **Vercel** for hosting and for the single serverless function

## Running it

```sh
npm install
npm run dev
```

Node 22.12 or later.

The budget page needs no setup locally. `vite.config.ts` carries a dev-only
plugin that replays the production API against a JSON file in
`node_modules/.tmp/`, conflict path included, so that branch stays exercised
without a network or a token. It opens with every figure at zero — the real
ones are never written to disk here.

## Scripts

| script               | what it does                                         |
| -------------------- | ---------------------------------------------------- |
| `npm run dev`        | Vite dev server, local budget API included           |
| `npm run build`      | type-check and bundle, in parallel                   |
| `npm run preview`    | serve the built output                               |
| `npm run type-check` | `vue-tsc` over the app and the Node-side files alike |
| `npm run lint`       | oxlint, then ESLint — both rewrite files in place    |
| `npm run format`     | Prettier over `src/`                                 |

## Layout

```
api/budget.ts            serverless function: reads and writes the budget
public/site/             printable CV and cover letter, rendered to PDF in-browser
src/components/          the sections the home page is assembled from
src/composables/         scroll, menu, locale, PDF export, budget state
src/services/budget.ts   the client half of the budget API
src/views/               IndexView (public) and BudgetView (private)
vite.config.ts           build config, plus the dev-only budget API
```

## The private half

`/_/budget` is a second page in the same bundle. Cloudflare Access gates it at
the edge, and the serverless function verifies the signed assertion on every
request and answers 401 without it — so the route holds even though its
JavaScript ships to everyone.

Writes are conditional. Each save carries the version it read, the store refuses
a stale one with a 412, and the client re-reads and replays its own change
instead of overwriting whatever landed in between. Two tabs can edit the same
month without either of them losing an entry.

Deploying it takes one environment variable, `DB_READ_WRITE_TOKEN`, a read-write
token for the Vercel Blob store. Without it the function answers 503 and the
page says so.

## PDF export

The CV and cover-letter buttons fetch the matching page out of `public/site/`
and rasterise it in the browser. There is no PDF service behind them, and both
documents stay editable as ordinary HTML and CSS.
