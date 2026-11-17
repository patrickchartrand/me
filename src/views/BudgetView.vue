<script setup lang="ts">
useHead({ title: 'Budget', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const {
  fixed,
  expenses,
  notes,
  spent,
  totals,
  overspent,
  loading,
  saving,
  error,
  addExpense,
  removeExpense,
  removeAllExpenses,
  notesChanged,
  saveNotes,
} = useBudget()

const label = ref('')
const amount = ref<number | null>(null)

function submit() {
  if (amount.value === null) return
  addExpense(label.value, amount.value)
  label.value = ''
  amount.value = null
}

const currency = new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' })
const fmt = (n: number) => currency.format(n)
const percent = (n: number) => `${Math.round(n)} %`

/*
 * Chart palette.
 *
 * The brand hues (#3d405b, #5dab9d, #137851) are deliberately desaturated and
 * fail categorical encoding: two of them are indistinguishable under deutan
 * vision. This quartet passes all six checks across ALL pairs, not just
 * adjacent ones — the four colours share one bar, so each must stand apart
 * from each. The terracotta sits at #c74a22 rather than the original #d9603a,
 * with which green and it collided under protan vision.
 */
const HUES = {
  personal: '#5a5fa6',
  shared: '#c74a22',
  spending: '#d9a441',
  remaining: '#137851',
  other: '#8a8a8a',
} as const

const RED = '#b3261e'

/** Where the income goes: one whole split into parts, so a single bar. */
const breakdown = computed(() => {
  if (!totals.value) return []
  const income = totals.value.monthlyIncome
  return [
    { label: 'Frais personnels', amount: totals.value.personal, colour: HUES.personal },
    { label: 'Frais communs', amount: totals.value.shared, colour: HUES.shared },
    { label: 'Dépenses du mois', amount: spent.value, colour: HUES.spending },
    { label: 'Reste', amount: Math.max(0, totals.value.remaining), colour: HUES.remaining },
  ]
    .filter((part) => part.amount > 0.005)
    .map((part) => ({ ...part, share: income > 0 ? (part.amount / income) * 100 : 0 }))
})

/** The heaviest commitments, both categories combined. */
const TOP = 6
const heaviest = computed(() => {
  if (!fixed.value) return []
  const all = [
    ...fixed.value.personal.map((i) => ({
      label: i.label,
      amount: i.amount,
      colour: HUES.personal as string,
    })),
    ...fixed.value.shared.map((i) => ({
      label: i.label,
      amount: i.share,
      colour: HUES.shared as string,
    })),
  ].sort((a, b) => b.amount - a.amount)

  const head = all.slice(0, TOP)
  const tail = all.slice(TOP)
  const rows =
    tail.length > 0
      ? [
          ...head,
          {
            label: `Autres (${tail.length} postes)`,
            amount: tail.reduce((total, i) => total + i.amount, 0),
            colour: HUES.other as string,
          },
        ]
      : head

  const ceiling = Math.max(...rows.map((r) => r.amount))
  return rows.map((r) => ({ ...r, share: (r.amount / ceiling) * 100 }))
})

/** Tooltip shared by both charts. */
const hover = ref<{ text: string; x: number; y: number } | null>(null)
function show(event: MouseEvent, text: string) {
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
  hover.value = { text, x: box.left + box.width / 2, y: box.top }
}
</script>

<template>
  <main class="min-h-screen px-6 py-24 md:px-12 md:py-32">
    <div class="mx-auto max-w-3xl">
      <header class="mb-20">
        <h1 class="font-serif text-4xl md:text-5xl">Budget mensuel</h1>
        <p v-if="fixed" class="mt-3 text-sm text-secondary">Mis à jour le {{ fixed.updatedAt }}</p>
      </header>

      <p v-if="error" class="mb-10 text-sm" :style="{ color: RED }">{{ error }}</p>

      <p v-if="loading" class="text-secondary">Chargement…</p>

      <template v-else-if="fixed && totals">
        <!-- Summary -->
        <section class="mb-20 grid gap-10 sm:grid-cols-3">
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-secondary">Revenu</p>
            <p class="mt-3 font-serif text-3xl tabular-nums">{{ fmt(totals.monthlyIncome) }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-secondary">À payer</p>
            <p class="mt-3 font-serif text-3xl tabular-nums">{{ fmt(totals.committed) }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-secondary">Reste</p>
            <p
              class="mt-3 font-serif text-3xl tabular-nums"
              :style="overspent ? { color: RED } : undefined"
            >
              {{ fmt(totals.remaining) }}
            </p>
            <p v-if="spent > 0" class="mt-1 text-xs text-secondary">
              dont {{ fmt(spent) }} de dépenses ce mois-ci
            </p>
          </div>
        </section>

        <!-- Where the income goes -->
        <section class="mb-20">
          <p class="mb-5 text-xs uppercase tracking-[0.2em] text-secondary">Où part le revenu</p>

          <div
            class="flex h-10 w-full gap-[2px]"
            role="img"
            :aria-label="
              breakdown.map((p) => `${p.label} ${fmt(p.amount)}, ${percent(p.share)}`).join('. ')
            "
          >
            <div
              v-for="part in breakdown"
              :key="part.label"
              class="h-full first:rounded-l-full last:rounded-r-full"
              :style="{ width: `${part.share}%`, backgroundColor: part.colour }"
              @mouseenter="show($event, `${part.label} — ${fmt(part.amount)}`)"
              @mouseleave="hover = null"
            />
          </div>

          <ul class="mt-5 flex flex-wrap gap-x-7 gap-y-2">
            <li
              v-for="part in breakdown"
              :key="part.label"
              class="flex items-baseline gap-2 text-sm"
            >
              <span
                class="inline-block h-2.5 w-2.5 shrink-0 translate-y-px rounded-full"
                :style="{ backgroundColor: part.colour }"
              />
              <span>{{ part.label }}</span>
              <span class="tabular-nums text-secondary">{{ percent(part.share) }}</span>
            </li>
          </ul>

          <p v-if="overspent" class="mt-5 text-sm" :style="{ color: RED }">
            Les dépenses dépassent ce qui restait de {{ fmt(Math.abs(totals.remaining)) }}.
          </p>
        </section>

        <!-- Heaviest commitments -->
        <section class="mb-20">
          <p class="mb-5 text-xs uppercase tracking-[0.2em] text-secondary">Les plus gros postes</p>

          <ul class="flex flex-col gap-3">
            <li v-for="row in heaviest" :key="row.label">
              <div class="flex items-baseline justify-between gap-4">
                <span class="text-sm">{{ row.label }}</span>
                <span class="text-sm tabular-nums text-secondary">{{ fmt(row.amount) }}</span>
              </div>
              <div class="mt-1.5 h-2 w-full">
                <div
                  class="h-full rounded-full"
                  :style="{ width: `${row.share}%`, backgroundColor: row.colour }"
                  @mouseenter="show($event, `${row.label} — ${fmt(row.amount)}`)"
                  @mouseleave="hover = null"
                />
              </div>
            </li>
          </ul>

          <ul class="mt-5 flex flex-wrap gap-x-7 gap-y-2 text-sm">
            <li class="flex items-baseline gap-2">
              <span
                class="inline-block h-2.5 w-2.5 shrink-0 translate-y-px rounded-full"
                :style="{ backgroundColor: HUES.personal }"
              />
              Frais personnels
            </li>
            <li class="flex items-baseline gap-2">
              <span
                class="inline-block h-2.5 w-2.5 shrink-0 translate-y-px rounded-full"
                :style="{ backgroundColor: HUES.shared }"
              />
              Frais communs
            </li>
            <li
              v-if="heaviest.some((r) => r.colour === HUES.other)"
              class="flex items-baseline gap-2"
            >
              <span
                class="inline-block h-2.5 w-2.5 shrink-0 translate-y-px rounded-full"
                :style="{ backgroundColor: HUES.other }"
              />
              Le reste, cumulé
            </li>
          </ul>
        </section>

        <!-- This month's expenses -->
        <section class="mb-20">
          <div class="mb-6 flex items-baseline justify-between">
            <h2 class="font-serif text-2xl">Dépenses du mois</h2>
            <span class="font-serif text-xl tabular-nums">{{ fmt(spent) }}</span>
          </div>

          <form class="mb-7 flex flex-wrap items-end gap-3" @submit.prevent="submit">
            <div class="min-w-[12rem] flex-1">
              <label
                for="label"
                class="mb-2 block text-xs uppercase tracking-[0.2em] text-secondary"
              >
                Quoi
              </label>
              <input
                id="label"
                v-model="label"
                type="text"
                required
                maxlength="120"
                placeholder="Épicerie"
                class="w-full rounded-full border border-charcoal/10 bg-white px-4 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>
            <div class="w-32">
              <label
                for="amount"
                class="mb-2 block text-xs uppercase tracking-[0.2em] text-secondary"
              >
                Combien
              </label>
              <input
                id="amount"
                v-model.number="amount"
                type="number"
                required
                min="0.01"
                step="0.01"
                inputmode="decimal"
                placeholder="0,00"
                class="w-full rounded-full border border-charcoal/10 bg-white px-4 py-2.5 text-right text-sm tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>
            <button
              type="submit"
              :disabled="saving"
              class="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-cream transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              Ajouter
            </button>
          </form>

          <p v-if="expenses.length === 0" class="text-sm text-secondary">
            Rien d’ajouté ce mois-ci.
          </p>

          <template v-else>
            <ul class="flex flex-col">
              <li
                v-for="e in expenses"
                :key="e.id"
                class="flex items-baseline gap-4 border-b border-[#e5e7eb] py-3 last:border-0"
              >
                <span class="flex-1 text-sm">
                  {{ e.label }}
                  <span class="block text-xs text-secondary">{{ e.date }}</span>
                </span>
                <span class="text-sm tabular-nums">{{ fmt(e.amount) }}</span>
                <button
                  type="button"
                  :disabled="saving"
                  class="rounded-full px-2 text-secondary transition-colors hover:text-accent disabled:opacity-50"
                  :aria-label="`Retirer ${e.label}`"
                  @click="removeExpense(e.id)"
                >
                  ×
                </button>
              </li>
            </ul>

            <button
              type="button"
              :disabled="saving"
              class="mt-5 text-xs uppercase tracking-[0.2em] text-secondary underline underline-offset-4 transition-colors hover:text-accent disabled:opacity-50"
              @click="removeAllExpenses()"
            >
              Tout retirer
            </button>
          </template>
        </section>

        <!-- Personal charges -->
        <section class="mb-20">
          <div class="mb-6 flex items-baseline justify-between">
            <h2 class="font-serif text-2xl">Frais personnels</h2>
            <span class="font-serif text-xl tabular-nums">{{ fmt(totals.personal) }}</span>
          </div>
          <ul class="flex flex-col">
            <li
              v-for="item in fixed.personal"
              :key="item.label"
              class="flex items-baseline gap-4 border-b border-[#e5e7eb] py-3 last:border-0"
            >
              <span class="flex-1 text-sm">
                {{ item.label }}
                <span
                  v-if="item.savings"
                  class="ml-2 rounded-full border border-primary/30 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-primary"
                  >épargne</span
                >
                <span v-if="item.note" class="block text-xs text-secondary">{{ item.note }}</span>
              </span>
              <span class="text-sm tabular-nums">{{ fmt(item.amount) }}</span>
            </li>
          </ul>
        </section>

        <!-- Shared charges -->
        <section class="mb-20">
          <div class="mb-6 flex items-baseline justify-between">
            <h2 class="font-serif text-2xl">Frais communs</h2>
            <span class="font-serif text-xl tabular-nums">{{ fmt(totals.shared) }}</span>
          </div>
          <ul class="flex flex-col">
            <li
              v-for="item in fixed.shared"
              :key="item.label"
              class="flex items-baseline gap-4 border-b border-[#e5e7eb] py-3 last:border-0"
            >
              <span class="flex-1 text-sm">
                {{ item.label }}
                <span v-if="item.note" class="block text-xs text-secondary">{{ item.note }}</span>
              </span>
              <span class="w-24 text-right text-sm tabular-nums text-secondary">
                {{ fmt(item.total) }}
              </span>
              <span class="w-24 text-right text-sm tabular-nums">{{ fmt(item.share) }}</span>
            </li>
          </ul>
        </section>

        <!-- Notes -->
        <section>
          <div class="mb-6 flex items-baseline justify-between">
            <h2 class="font-serif text-2xl">Notes</h2>
            <span v-if="saving" class="text-xs uppercase tracking-[0.2em] text-secondary">
              enregistrement…
            </span>
          </div>
          <label for="notes" class="sr-only">Notes personnelles</label>
          <textarea
            id="notes"
            v-model="notes"
            rows="8"
            class="w-full resize-y rounded-2xl border border-charcoal/10 bg-white p-5 text-sm leading-relaxed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            @input="notesChanged()"
            @blur="saveNotes()"
          ></textarea>
        </section>
      </template>
    </div>

    <!-- Chart tooltip -->
    <div
      v-if="hover"
      class="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-full bg-charcoal px-3 py-1.5 text-xs text-cream"
      :style="{ left: `${hover.x}px`, top: `${hover.y - 8}px` }"
      role="status"
    >
      {{ hover.text }}
    </div>
  </main>
</template>

<style scoped>
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  margin: 0;
  -webkit-appearance: none;
  appearance: none;
}

input[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
