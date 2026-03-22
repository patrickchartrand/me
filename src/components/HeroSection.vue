<template>
  <section id="hero" class="px-6 md:px-12 lg:px-24 mb-24 md:mb-40 min-h-[80vh] flex items-center">
    <div class="max-w-7xl mx-auto w-full">
      <p class="text-xs uppercase tracking-[0.3em] text-secondary mb-8 reveal-text">
        Frontend Developer & UI Systems Specialist
      </p>

      <h1
        class="font-serif text-5xl md:text-7xl lg:text-[8rem] leading-[1.05] font-medium tracking-tight mb-16 reveal-text"
        style="animation-delay: 0.15s"
      >
        Building component-driven <br />
        <span class="highlight-offset">interfaces</span> that<br />
        <span class="relative inline-block">hold up.</span>
      </h1>

      <div
        class="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 pt-8 reveal-text"
        style="animation-delay: 0.4s"
      >
        <i id="about" class="absolute -top-28" />
        <div class="max-w-xl">
          <p class="text-lg md:text-xl font-light leading-relaxed text-charcoal/80">
            I come from writing and publishing, and this background shapes how I think about
            structure, hierarchy, and clarity. Today I bridge design and code, building
            component-driven interfaces and design systems that are as easy to maintain as they are
            to use. I bring the same rigour to a button component as I do to a full page
            architecture.
          </p>
        </div>
        <div class="flex flex-col gap-2 text-right">
          <span class="text-xs uppercase tracking-[0.2em] text-secondary">Based in</span>
          <span class="text-xl font-serif">Granby, Quebec</span>
          <div class="flex items-center gap-2 mt-2 justify-end">
            <span class="relative flex h-2.5 w-2.5">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"
              ></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-700"></span>
            </span>
            <span class="text-xs text-available font-medium">Available for work</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.highlight-offset {
  position: relative;
  display: inline-block;
  z-index: 1;
}
.highlight-offset::before {
  content: '';
  display: block;
  width: 100%;
  height: 80%;
  position: absolute;
  bottom: -10px;
  left: 18px;
  z-index: -1;
  background-color: var(--color-lavender);
  transition: all 0.3s ease;
}
.highlight-offset:hover::before {
  height: 60%;
}
</style>
