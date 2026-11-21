<script setup lang="ts">
const { t, locale } = useI18n()

const SITE_URL = 'https://patrickchartrand.dev'
const SHARE_IMAGE = `${SITE_URL}/images/profil.jpg`

useHead({
  htmlAttrs: {
    lang: () => (locale.value === 'fr' ? 'fr-CA' : 'en-CA'),
  },
  title: () => t('app.title'),
  link: [{ rel: 'canonical', href: SITE_URL }],
  meta: [
    { name: 'description', content: () => t('app.description') },
    { name: 'author', content: 'Patrick Chartrand' },

    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Patrick Chartrand' },
    { property: 'og:url', content: SITE_URL },
    { property: 'og:locale', content: () => (locale.value === 'fr' ? 'fr_CA' : 'en_CA') },
    { property: 'og:title', content: () => t('app.title') },
    { property: 'og:description', content: () => t('app.description') },
    { property: 'og:image', content: SHARE_IMAGE },
    { property: 'og:image:width', content: '400' },
    { property: 'og:image:height', content: '400' },
    { property: 'og:image:alt', content: 'Patrick Chartrand' },

    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: () => t('app.title') },
    { name: 'twitter:description', content: () => t('app.description') },
    { name: 'twitter:image', content: SHARE_IMAGE },
  ],
})

useScrollAnimations()

/*
 * A shared or bookmarked /#work arrives before the sections exist: the browser
 * makes its own jump while #app is still empty, and misses. The router used to
 * redo it once the route resolved; with the router gone this is the only thing
 * left that does. scroll-padding-top in style.css supplies the 6rem offset.
 * The hash then comes off the URL, as it always did.
 */
onMounted(() => {
  const { hash } = window.location
  if (!hash) return
  try {
    document.querySelector(hash)?.scrollIntoView()
  } catch {
    // An id-shaped fragment that is not a valid selector; nothing to scroll to.
  }
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
})
</script>

<template>
  <div
    class="bg-cream text-charcoal font-sans antialiased selection:bg-charcoal selection:text-cream"
  >
    <TheHeader />
    <main class="pt-32 md:pt-40">
      <HeroSection />
      <StatsSection />
      <WorkSection />
      <ExperienceSection />
      <StackSection />
      <TestimonialsSection />
    </main>
    <TheFooter />
  </div>
</template>
