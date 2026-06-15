function clampProgress(value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return 0;
  }

  return Math.min(Math.max(numericValue, 0), 100);
}

function updateMeter(module, progress) {
  const meter = module.querySelector("[data-stack-meter]");
  const meterValue = module.querySelector("[data-stack-meter-value]");
  const safeProgress = clampProgress(progress);

  if (!meter || !meterValue) {
    return;
  }

  meter.style.setProperty("--progress", safeProgress);
  meterValue.textContent = `${safeProgress}%`;
}

function initStackCarousel() {
  const MOBILE_BREAKPOINT = 1023;
  const carousel = document.querySelector("[data-stack-carousel]");
  const track = document.querySelector("[data-stack-track]");
  const slides = Array.from(document.querySelectorAll("[data-stack-slide]"));
  const prevButton = document.querySelector("[data-stack-prev]");
  const nextButton = document.querySelector("[data-stack-next]");
  const dotsContainer = document.querySelector("[data-stack-dots]");

  if (!carousel || !track || !slides.length || !prevButton || !nextButton || !dotsContainer) {
    return;
  }

  let activeIndex = 0;
  let touchStartX = 0;
  let touchStartY = 0;

  const dots = slides.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className =
      "h-2.5 w-2.5 rounded-full border border-cyan-300/20 bg-white/10 transition-[transform,background-color,border-color,opacity] duration-200 hover:scale-110 hover:border-cyan-300/50 hover:bg-cyan-300/45";
    dot.setAttribute("aria-label", `Ir a la card ${index + 1}`);
    dot.addEventListener("click", () => {
      updateCarousel(index);
    });
    dotsContainer.appendChild(dot);
    return dot;
  });

  function updateCarousel(index) {
    activeIndex = Math.min(Math.max(index, 0), slides.length - 1);
    const isCompactViewport = window.innerWidth <= MOBILE_BREAKPOINT;

    slides.forEach((slide, slideIndex) => {
      const module = slide.querySelector("[data-stack-module]");
      const isActive = slideIndex === activeIndex;
      const offset = slideIndex - activeIndex;
      const distance = Math.abs(offset);
      const direction = offset === 0 ? 0 : Math.sign(offset);
      const translateX = direction * Math.min(isCompactViewport ? 92 : 140, (isCompactViewport ? 32 : 54) + distance * (isCompactViewport ? 18 : 28));
      const translateY = distance * (isCompactViewport ? 5 : 8);
      const rotate = direction * Math.min(isCompactViewport ? 6 : 10, (isCompactViewport ? 2 : 4) + distance * 2);
      const scale = Math.max(isCompactViewport ? 0.88 : 0.78, 1 - distance * (isCompactViewport ? 0.05 : 0.08));
      const opacity = Math.max(0, 1 - distance * 0.24);
      const zIndex = slides.length - distance;

      slide.setAttribute("aria-hidden", String(!isActive));
      slide.style.zIndex = String(zIndex);
      slide.style.pointerEvents = isActive ? "auto" : "none";
      slide.style.opacity = String(opacity);
      slide.style.transform = isActive
        ? "translate3d(0, 0, 0) scale(1)"
        : `translate3d(${translateX}px, ${translateY}px, 0) rotate(${rotate}deg) scale(${scale})`;
      slide.style.transition =
        "transform 500ms cubic-bezier(0.22,1,0.36,1), opacity 320ms ease";

      if (module) {
        module.dataset.active = String(isActive);
        module.style.opacity = isActive ? "1" : "0.88";
      }

      dots[slideIndex].style.opacity = isActive ? "1" : "0.55";
      dots[slideIndex].style.transform = isActive ? "scale(1.15)" : "scale(1)";
      dots[slideIndex].style.backgroundColor = isActive
        ? "rgba(72, 243, 255, 0.8)"
        : "rgba(255, 255, 255, 0.1)";
      dots[slideIndex].style.borderColor = isActive
        ? "rgba(72, 243, 255, 0.75)"
        : "rgba(72, 243, 255, 0.2)";
    });

    prevButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex === slides.length - 1;
  }

  prevButton.addEventListener("click", () => {
    updateCarousel(activeIndex - 1);
  });

  nextButton.addEventListener("click", () => {
    updateCarousel(activeIndex + 1);
  });

  carousel.addEventListener("touchstart", (event) => {
    if (window.innerWidth > MOBILE_BREAKPOINT || !event.touches.length) {
      return;
    }

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }, { passive: true });

  carousel.addEventListener("touchend", (event) => {
    if (window.innerWidth > MOBILE_BREAKPOINT || !event.changedTouches.length) {
      return;
    }

    const deltaX = event.changedTouches[0].clientX - touchStartX;
    const deltaY = event.changedTouches[0].clientY - touchStartY;

    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0) {
      updateCarousel(activeIndex + 1);
      return;
    }

    updateCarousel(activeIndex - 1);
  }, { passive: true });

  window.addEventListener("resize", () => {
    updateCarousel(activeIndex);
  });

  updateCarousel(0);
}

export function initStackInteractions() {
  const stackModules = Array.from(document.querySelectorAll("[data-stack-module]"));

  if (!stackModules.length) {
    return;
  }

  initStackCarousel();

  stackModules.forEach((module) => {
    const defaultProgress = clampProgress(module.dataset.stackDefaultProgress);
    const skills = Array.from(module.querySelectorAll("[data-stack-skill]"));

    updateMeter(module, defaultProgress);

    skills.forEach((skill) => {
      skill.addEventListener("mouseenter", () => {
        updateMeter(module, skill.dataset.stackSkillProgress);
      });
    });

    module.addEventListener("mouseleave", () => {
      updateMeter(module, defaultProgress);
    });
  });
}
