function clampProgress(value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return 0;
  }

  return Math.min(Math.max(numericValue, 0), 100);
}

function clampRange(value, min, max) {
  return Math.min(Math.max(value, min), max);
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
  let dragStartX = 0;
  let dragStartY = 0;
  let dragDeltaX = 0;
  let isDragging = false;
  let activePointerId = null;

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

  function updateCarousel(index, dragOffset = 0) {
    activeIndex = Math.min(Math.max(index, 0), slides.length - 1);
    const isCompactViewport = window.innerWidth <= MOBILE_BREAKPOINT;

    slides.forEach((slide, slideIndex) => {
      const module = slide.querySelector("[data-stack-module]");
      const isActive = slideIndex === activeIndex;
      const offset = slideIndex - activeIndex;
      const distance = Math.abs(offset);
      const direction = offset === 0 ? 0 : Math.sign(offset);
      const translateX = direction * Math.min(
        isCompactViewport ? 84 : 122,
        (isCompactViewport ? 28 : 44) + distance * (isCompactViewport ? 14 : 22)
      );
      const translateY = distance * (isCompactViewport ? 3 : 5);
      const rotate = direction * Math.min(
        isCompactViewport ? 4.5 : 7,
        (isCompactViewport ? 1.6 : 2.6) + distance * 1.4
      );
      const scale = Math.max(
        isCompactViewport ? 0.91 : 0.84,
        1 - distance * (isCompactViewport ? 0.04 : 0.06)
      );
      const opacity = Math.max(0.2, 1 - distance * 0.18);
      const zIndex = slides.length - distance;
      const dragTranslateX = dragOffset * (isCompactViewport ? 82 : 110);
      const currentTranslateX = isActive
        ? dragTranslateX
        : translateX + dragTranslateX * 0.92;
      const dragRotate = dragOffset * (isCompactViewport ? 2.2 : 3.2);

      slide.setAttribute("aria-hidden", String(!isActive));
      slide.style.zIndex = String(zIndex);
      slide.style.pointerEvents = isActive ? "auto" : "none";
      slide.style.opacity = String(opacity);
      slide.style.transform = isActive
        ? `translate3d(${currentTranslateX}px, 0, 0) rotate(${dragRotate}deg) scale(1)`
        : `translate3d(${currentTranslateX}px, ${translateY}px, 0) rotate(${rotate + dragRotate}deg) scale(${scale})`;
      slide.style.transition =
        isDragging
          ? "none"
          : "transform 520ms cubic-bezier(0.2,0.9,0.22,1), opacity 320ms ease";

      if (module) {
        module.dataset.active = String(isActive);
        module.style.opacity = isActive ? "1" : "0.94";
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

  const beginDrag = (clientX, clientY, pointerId = null) => {
    if (window.innerWidth > MOBILE_BREAKPOINT) {
      return;
    }

    dragStartX = clientX;
    dragStartY = clientY;
    dragDeltaX = 0;
    isDragging = true;
    activePointerId = pointerId;
  };

  const moveDrag = (clientX, clientY) => {
    if (!isDragging || window.innerWidth > MOBILE_BREAKPOINT) {
      return;
    }

    const deltaX = clientX - dragStartX;
    const deltaY = clientY - dragStartY;

    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 14) {
      isDragging = false;
      activePointerId = null;
      updateCarousel(activeIndex);
      return;
    }

    dragDeltaX = deltaX;
    const signedOffset = clampRange(
      deltaX / Math.max(carousel.clientWidth || 1, 1),
      -0.75,
      0.75
    );
    updateCarousel(activeIndex, signedOffset);
  };

  const endDrag = () => {
    if (!isDragging) {
      return;
    }

    const dragOffset = dragDeltaX / Math.max(carousel.clientWidth || 1, 1);
    isDragging = false;
    activePointerId = null;

    if (dragOffset <= -0.18) {
      updateCarousel(activeIndex + 1);
      return;
    }

    if (dragOffset >= 0.18) {
      updateCarousel(activeIndex - 1);
      return;
    }

    updateCarousel(activeIndex);
  };

  carousel.addEventListener("pointerdown", (event) => {
    beginDrag(event.clientX, event.clientY, event.pointerId);
  });

  carousel.addEventListener("pointermove", (event) => {
    if (activePointerId !== event.pointerId) {
      return;
    }

    moveDrag(event.clientX, event.clientY);
  });

  carousel.addEventListener("pointerup", (event) => {
    if (activePointerId !== event.pointerId) {
      return;
    }

    endDrag();
  });

  carousel.addEventListener("pointercancel", () => {
    isDragging = false;
    activePointerId = null;
    updateCarousel(activeIndex);
  });

  window.addEventListener("resize", () => {
    isDragging = false;
    activePointerId = null;
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
