# Patrick Chartrand — portfolio

The source of [patrickchartrand.dev](https://patrickchartrand.dev): a single-page
portfolio in French and English.

## Stack

- **Vue 3.5** single-file components, `<script setup>`, TypeScript throughout
- **Vite 7**, with composables and components auto-imported — the generated
  declarations live in `src/types/` and are rewritten on every build, so they
  are never edited by hand
- **Tailwind CSS v4** through `@tailwindcss/vite`; the palette, breakpoints and
  the few hand-written rules all sit in `src/assets/style.css`
- **vue-i18n** for the French and English copy, **@unhead/vue** for metadata
  that follows the chosen locale
- **Vercel** for hosting

## Running it

```sh
npm install
npm run dev
```

Node 22.12 or later. There is nothing else to configure: the site is static,
with no API, no database and no environment variables.

## Scripts

| script               | what it does                                      |
| -------------------- | ------------------------------------------------- |
| `npm run dev`        | Vite dev server                                   |
| `npm run build`      | type-check and bundle, in parallel                |
| `npm run preview`    | serve the built output                            |
| `npm run type-check` | `vue-tsc` over the app and the Vite config alike  |
| `npm run lint`       | oxlint, then ESLint — both rewrite files in place |
| `npm run format`     | Prettier over `src/`                              |

## Layout

```
public/site/       printable CV and cover letter, rendered to PDF in-browser
src/App.vue        the page itself: metadata, then the sections in order
src/components/    the sections the page is assembled from
src/composables/   scroll, menu, locale, PDF export
src/i18n/          the French and English copy
```

One page, one component tree, no router.

## PDF export

The CV and cover-letter buttons fetch the matching page out of `public/site/`
and rasterise it in the browser. There is no PDF service behind them, and both
documents stay editable as ordinary HTML and CSS.

## License

The code is MIT. The content is not — the copy, the photographs, the CV and
cover letter, and the testimonials stay all rights reserved. See
[LICENSE](LICENSE) for the split.
