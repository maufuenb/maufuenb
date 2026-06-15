function initProjectCarousel(root) {
  const TABLET_BREAKPOINT = 1023;
  const MOBILE_BREAKPOINT = 767;
  const carousel = root.querySelector("[data-project-carousel]");
  const track = root.querySelector("[data-project-track]");
  const slides = Array.from(root.querySelectorAll("[data-project-slide]"));
  const prevButton = root.querySelector("[data-project-prev]");
  const nextButton = root.querySelector("[data-project-next]");
  const dotsContainer = root.querySelector("[data-project-dots]");
  const controls = prevButton?.closest("div.mb-5");

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
    dot.setAttribute("aria-label", `Ir al proyecto ${index + 1}`);
    dot.addEventListener("click", () => {
      updateCarousel(index);
    });
    dotsContainer.appendChild(dot);
    return dot;
  });

  const syncTrackHeight = (isCompactViewport) => {
    if (!isCompactViewport) {
      track.style.height = "";
      return;
    }

    let maxHeight = 0;

    slides.forEach((slide) => {
      const article = slide.firstElementChild;

      if (!article) {
        return;
      }

      maxHeight = Math.max(maxHeight, article.offsetHeight);
    });

    track.style.height = maxHeight ? `${maxHeight}px` : "";
  };

  const resetDesktopLayout = () => {
    track.style.height = "";

    slides.forEach((slide) => {
      const article = slide.firstElementChild;

      slide.setAttribute("aria-hidden", "false");
      slide.style.position = "";
      slide.style.inset = "";
      slide.style.display = "";
      slide.style.alignItems = "";
      slide.style.justifyContent = "";
      slide.style.width = "";
      slide.style.paddingInline = "";
      slide.style.zIndex = "";
      slide.style.pointerEvents = "";
      slide.style.opacity = "";
      slide.style.transform = "";
      slide.style.transition = "";

      if (article) {
        article.dataset.active = "true";
        article.style.opacity = "";
      }
    });

    dots.forEach((dot) => {
      dot.style.opacity = "";
      dot.style.transform = "";
      dot.style.backgroundColor = "";
      dot.style.borderColor = "";
    });
  };

  function updateCarousel(index) {
    activeIndex = Math.min(Math.max(index, 0), slides.length - 1);
    const viewportWidth = window.innerWidth;
    const isCompactViewport = viewportWidth <= TABLET_BREAKPOINT;
    const isMobileViewport = viewportWidth <= MOBILE_BREAKPOINT;

    root.dataset.projectCompact = String(isCompactViewport);

    if (!isCompactViewport) {
      resetDesktopLayout();
      prevButton.disabled = false;
      nextButton.disabled = false;
      return;
    }

    syncTrackHeight(true);

    slides.forEach((slide, slideIndex) => {
      const article = slide.firstElementChild;
      const isActive = slideIndex === activeIndex;
      const offset = slideIndex - activeIndex;
      const distance = Math.abs(offset);
      const direction = offset === 0 ? 0 : Math.sign(offset);
      const translateX = direction
        * Math.min(isMobileViewport ? 92 : 140, (isMobileViewport ? 34 : 54) + distance * (isMobileViewport ? 18 : 28));
      const translateY = distance * (isMobileViewport ? 5 : 8);
      const rotate = direction * Math.min(isMobileViewport ? 6 : 10, (isMobileViewport ? 2 : 4) + distance * 2);
      const scale = Math.max(isMobileViewport ? 0.88 : 0.78, 1 - distance * (isMobileViewport ? 0.05 : 0.08));
      const opacity = Math.max(0, 1 - distance * 0.24);
      const zIndex = slides.length - distance;

      slide.setAttribute("aria-hidden", String(!isActive));
      slide.style.position = "absolute";
      slide.style.inset = "0";
      slide.style.display = "flex";
      slide.style.alignItems = "center";
      slide.style.justifyContent = "center";
      slide.style.width = "100%";
      slide.style.paddingInline = isMobileViewport ? "0" : "0.9rem";
      slide.style.zIndex = String(zIndex);
      slide.style.pointerEvents = isActive ? "auto" : "none";
      slide.style.opacity = String(opacity);
      slide.style.transform = isActive
        ? "translate3d(0, 0, 0) scale(1)"
        : `translate3d(${translateX}px, ${translateY}px, 0) rotate(${rotate}deg) scale(${scale})`;
      slide.style.transition =
        "transform 500ms cubic-bezier(0.22,1,0.36,1), opacity 320ms ease";

      if (article) {
        article.dataset.active = String(isActive);
        article.style.opacity = isActive ? "1" : "0.88";
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
    if (window.innerWidth > TABLET_BREAKPOINT || !event.touches.length) {
      return;
    }

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }, { passive: true });

  carousel.addEventListener("touchend", (event) => {
    if (window.innerWidth > TABLET_BREAKPOINT || !event.changedTouches.length) {
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

  if (slides.length <= 1) {
    prevButton.disabled = true;
    nextButton.disabled = true;
    if (controls) {
      controls.style.display = "none";
    }
    dotsContainer.style.display = "none";
  }

  updateCarousel(0);
}

export function initProjectCardEffects() {
  const projectCarousels = Array.from(document.querySelectorAll("[data-project-carousel-root]"));

  if (!projectCarousels.length) {
    return;
  }

  projectCarousels.forEach((root) => {
    initProjectCarousel(root);
  });
}
