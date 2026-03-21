<script setup lang="ts">
import { useActiveSection } from '@/composables/useActiveSection'
import { useMobileMenu } from '@/composables/useMobileMenu'
import { useHeaderScroll } from '@/composables/useHeaderScroll'

useHeaderScroll()

const { activeSection } = useActiveSection()
const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useMobileMenu()

const navLinks = [
  { href: '#about', label: 'About', section: 'about' },
  { href: '#work', label: 'Work', section: 'work' },
  { href: '#experience', label: 'Experience', section: 'experience' },
  { href: '#footer', label: 'Contact', section: 'footer' },
]
</script>

<template>
  <header
    id="header"
    class="fixed top-0 left-0 w-full z-50 px-6 md:px-12 flex justify-between items-center bg-cream/80 backdrop-blur-md transition-all duration-500 py-6"
  >
    <div class="text-sm tracking-[0.25em] uppercase font-semibold">Patrick Chartrand</div>

    <nav class="hidden md:flex gap-8 text-sm font-medium tracking-wide">
      <a
        v-for="link in navLinks"
        :key="link.href"
        :href="link.href"
        class="nav-link-highlight pb-1"
        :class="{ 'nav-link-active': link.section && activeSection === link.section }"
      >
        {{ link.label }}
      </a>
    </nav>

    <button
      class="md:hidden text-xl focus:outline-none z-50 relative"
      :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
      @click="toggleMobileMenu"
    >
      <svg
        v-if="!mobileMenuOpen"
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h10M4 18h16"
        />
      </svg>
      <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </header>

  <!-- Mobile Menu Overlay -->
  <Transition name="mobile-menu">
    <div
      v-if="mobileMenuOpen"
      class="fixed inset-0 z-40 bg-cream flex flex-col justify-center items-center gap-10"
    >
      <a
        v-for="link in navLinks"
        :key="link.href"
        :href="link.href"
        class="text-4xl font-serif text-charcoal hover:text-primary transition-colors"
        @click="closeMobileMenu"
      >
        {{ link.label }}
      </a>
    </div>
  </Transition>
</template>

<style scoped>
.nav-link-highlight {
  position: relative;
  display: inline-block;
  z-index: 1;
}
.nav-link-highlight::before {
  content: '';
  display: block;
  width: 100%;
  height: 80%;
  position: absolute;
  top: 4px;
  left: 6px;
  z-index: -1;
  background-color: var(--color-lavender);
  opacity: 0;
  transition: all 0.3s ease;
}
.nav-link-highlight:hover::before,
.nav-link-active::before {
  opacity: 1;
  height: 60%;
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
