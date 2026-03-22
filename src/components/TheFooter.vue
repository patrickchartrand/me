<script setup lang="ts">
import { useFileDownload } from '@/composables/useFileDownload'

const year = new Date().getFullYear()

const socialLinks = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/patrick-chartrand-6b4331235',
    viewBox: '0 0 24 24',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  {
    label: 'GitHub',
    href: 'https://github.com/patrickchartrand',
    viewBox: '0 0 24 24',
    path: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  },
  {
    label: 'Bluesky',
    href: 'https://bsky.app/profile/pchartrand.bsky.social',
    viewBox: '0 0 24 24',
    path: 'M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.144-.019.287-.041.43-.066-.143.025-.287.047-.43.066-3.876.572-7.297 2.066-2.196 7.054C7.421 23.986 9.37 23.204 12 23.204c2.63 0 4.579.782 7.189-2.539 5.101-4.988 1.68-6.482-2.196-7.054a8.607 8.607 0 0 1-.43-.066c.143.025.286.047.43.066 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.204-.659-.299-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z',
  },
]
</script>

<template>
  <footer
    id="footer"
    class="bg-primary text-cream px-6 md:px-12 lg:px-24 py-28 md:py-40 !pb-28 relative overflow-hidden"
  >
    <div
      class="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
    />
    <div
      class="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"
    />

    <div class="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
        <path
          fill="#ffffff"
          d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18.1,96.5,-2.9C96.2,12.3,89.5,27.3,80.1,40.4C70.6,53.5,58.4,64.8,44.5,73.1C30.6,81.4,15.3,86.7,0.5,85.8C-14.3,84.9,-28.6,77.8,-41.8,69.1C-55,60.4,-67.2,50.1,-76.3,37.2C-85.4,24.3,-91.4,8.8,-90.6,-6.3C-89.8,-21.4,-82.2,-36.1,-71.7,-47.9C-61.2,-59.7,-47.8,-68.6,-33.9,-75.7C-20,-82.8,-5.6,-88.1,4.7,-95.1C15,-102.1,30.6,-83.6,44.7,-76.4Z"
          transform="translate(100 100) scale(1.1)"
        />
      </svg>
    </div>

    <div class="max-w-7xl mx-auto relative z-10">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-end mb-28">
        <div class="fade-in-up">
          <p class="text-xs uppercase tracking-[0.3em] text-white/40 mb-6">Get in touch</p>
          <h2 class="text-5xl md:text-7xl lg:text-8xl mb-10 leading-none font-serif">
            Let's bring your <br /><span class="text-white/70">ideas to life.</span>
          </h2>
          <div class="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:patrick.chartrand@umontreal.ca"
              class="group inline-flex items-center gap-4 bg-cream text-primary px-8 py-4 rounded-full font-medium hover:scale-105 hover:shadow-lg hover:shadow-cream/20 transition-all duration-300"
            >
              Start a Project
              <span
                class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </span>
            </a>

            <a
              href="#"
              class="group inline-flex items-center gap-4 bg-[#63667b] text-cream px-8 py-4 rounded-full font-medium hover:bg-[#8a8c9c] hover:scale-105 transition-all duration-300"
              @click.prevent="
                useFileDownload({ filename: 'pchartrand-cv.pdf', filepath: '/site/cv.html' })
              "
            >
              Download CV
              <span
                class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </span>
            </a>
          </div>
        </div>

        <div class="lg:text-right fade-in-up">
          <p class="text-white/50 text-lg max-w-md ml-auto leading-relaxed mb-8">
            Currently available for freelance projects and open to full-time opportunities.
          </p>
          <div class="flex gap-4 lg:justify-end">
            <a
              v-for="link in socialLinks"
              :key="link.label"
              :href="link.href"
              :aria-label="link.label"
              class="w-12 h-12 bg-[#63667b] rounded-full flex items-center justify-center hover:bg-[#8a8c9c] transition-all duration-300"
            >
              <svg class="w-5 h-5" fill="currentColor" :viewBox="link.viewBox">
                <path :d="link.path" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div
        class="pt-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div class="text-sm text-white/30">
          © {{ year }} Patrick Chartrand. All rights reserved.
        </div>
        <div class="flex gap-8 text-sm uppercase tracking-widest text-white/40">
          <a href="#" class="hover:text-white/80 transition-colors">Top</a>
          <a href="#work" class="hover:text-white/80 transition-colors">Work</a>
          <a href="#experience" class="hover:text-white/80 transition-colors">Experience</a>
        </div>
      </div>
    </div>
  </footer>
</template>
