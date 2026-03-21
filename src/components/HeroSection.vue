<template>
  <section id="hero" class="px-6 md:px-12 lg:px-24 mb-24 md:mb-40 min-h-[80vh] flex items-center">
    <div class="max-w-7xl mx-auto w-full">
      <p class="text-xs uppercase tracking-[0.3em] text-secondary mb-8 reveal-text">
        Frontend Developer & Design Systems
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
        <div class="max-w-xl">
          <p class="text-lg md:text-xl font-light leading-relaxed text-charcoal/80">
            I come from writing and publishing — that background shapes how I think about structure,
            hierarchy, and clarity. I bridge design and code, bringing the same rigour to every
            layer of the stack.
          </p>
        </div>
        <div class="flex flex-col gap-2 text-right">
          <span class="text-xs uppercase tracking-[0.2em] text-secondary">Based in</span>
          <span class="text-xl font-serif">Granby, Canada</span>
          <div class="flex items-center gap-2 mt-2 justify-end">
            <span class="pulse-wrapper">
              <span class="pulse-ring ring-1"></span>
              <span class="pulse-ring ring-2"></span>
              <span class="pulse-dot"></span>
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

/* Pulse */
.pulse-wrapper {
  position: relative;
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-available);
  position: relative;
  z-index: 2;
}

.pulse-ring {
  position: absolute;
  border-radius: 50%;
  background-color: var(--color-available);
  opacity: 0;
  z-index: 1;
}

.ring-1 {
  width: 18px;
  height: 18px;
  animation: pulse-out 2s ease-out infinite;
}

.ring-2 {
  width: 18px;
  height: 18px;
  animation: pulse-out 2s ease-out infinite 0.6s;
}

@keyframes pulse-out {
  0% {
    transform: scale(0.5);
    opacity: 0.6;
  }
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
}
</style>
