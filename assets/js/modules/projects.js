function initProjectCarousel(root) {
  const DESKTOP_WIDE_BREAKPOINT = 1440;
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

  const resetDotStyles = () => {
    dots.forEach((dot) => {
      dot.style.opacity = "";
      dot.style.transform = "";
      dot.style.backgroundColor = "";
      dot.style.borderColor = "";
    });
  };

  const getDesktopVisibleCount = () => (window.innerWidth >= DESKTOP_WIDE_BREAKPOINT ? 4 : 3);

  const updateDesktopDots = (startIndex, visibleCount) => {
    const maxStartIndex = Math.max(0, slides.length - visibleCount);

    dots.forEach((dot, dotIndex) => {
      const isVisible = dotIndex >= startIndex && dotIndex < startIndex + visibleCount;
      const isEdge = dotIndex === startIndex || dotIndex === Math.min(startIndex + visibleCount - 1, slides.length - 1);

      dot.style.opacity = isVisible ? "1" : "0.35";
      dot.style.transform = isEdge ? "scale(1.1)" : "scale(1)";
      dot.style.backgroundColor = isVisible
        ? "rgba(72, 243, 255, 0.62)"
        : "rgba(255, 255, 255, 0.08)";
      dot.style.borderColor = isVisible
        ? "rgba(72, 243, 255, 0.58)"
        : "rgba(72, 243, 255, 0.18)";
    });

    prevButton.disabled = startIndex === 0;
    nextButton.disabled = startIndex >= maxStartIndex;
  };

  const updateDesktopCarousel = (requestedIndex) => {
    const visibleCount = Math.min(getDesktopVisibleCount(), slides.length);
    const maxStartIndex = Math.max(0, slides.length - visibleCount);
    const startIndex = Math.min(Math.max(requestedIndex, 0), maxStartIndex);

    activeIndex = startIndex;
    root.style.setProperty("--project-visible-count", String(visibleCount));
    root.dataset.projectCompact = "false";
    track.style.height = "";
    track.style.transform = `translate3d(calc(-${startIndex} * ((100% - (${visibleCount} - 1) * 1.5rem) / ${visibleCount} + 1.5rem)), 0, 0)`;

    slides.forEach((slide, slideIndex) => {
      const article = slide.firstElementChild;
      const isVisible = slideIndex >= startIndex && slideIndex < startIndex + visibleCount;

      slide.setAttribute("aria-hidden", String(!isVisible));
      slide.style.position = "";
      slide.style.inset = "";
      slide.style.display = "";
      slide.style.alignItems = "";
      slide.style.justifyContent = "";
      slide.style.width = "";
      slide.style.paddingInline = "";
      slide.style.zIndex = "";
      slide.style.pointerEvents = "auto";
      slide.style.opacity = "1";
      slide.style.transform = "";
      slide.style.transition = "";

      if (article) {
        article.dataset.active = String(isVisible);
        article.style.opacity = "";
      }
    });

    updateDesktopDots(startIndex, visibleCount);
  };

  function updateCarousel(index, dragOffset = 0) {
    const viewportWidth = window.innerWidth;
    const isCompactViewport = viewportWidth <= TABLET_BREAKPOINT;
    const isMobileViewport = viewportWidth <= MOBILE_BREAKPOINT;

    if (!isCompactViewport) {
      updateDesktopCarousel(index);
      return;
    }

    activeIndex = Math.min(Math.max(index, 0), slides.length - 1);
    root.dataset.projectCompact = "true";

    syncTrackHeight(true);
    track.style.transform = "";

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

      const dragTranslateX = dragOffset * (isMobileViewport ? 82 : 110);
      const currentTranslateX = isActive ? dragTranslateX : translateX + dragTranslateX;
      const dragRotate = dragOffset * (isMobileViewport ? 3.5 : 5);

      slide.style.transform = isActive
        ? `translate3d(${currentTranslateX}px, 0, 0) rotate(${dragRotate}deg) scale(1)`
        : `translate3d(${currentTranslateX}px, ${translateY}px, 0) rotate(${rotate + dragRotate}deg) scale(${scale})`;
      slide.style.transition =
        isDragging
          ? "none"
          : "transform 420ms cubic-bezier(0.22,1,0.36,1), opacity 260ms ease";

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

  const beginDrag = (clientX, clientY, pointerId = null) => {
    if (window.innerWidth > TABLET_BREAKPOINT) {
      return;
    }

    dragStartX = clientX;
    dragStartY = clientY;
    dragDeltaX = 0;
    isDragging = true;
    activePointerId = pointerId;
  };

  const moveDrag = (clientX, clientY) => {
    if (!isDragging || window.innerWidth > TABLET_BREAKPOINT) {
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
    const dragOffset = clamp(deltaX / Math.max(carousel.clientWidth || 1, 1), -0.75, 0.75);
    updateCarousel(activeIndex, dragOffset);
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

  if (slides.length <= 1) {
    prevButton.disabled = true;
    nextButton.disabled = true;
    if (controls) {
      controls.style.display = "none";
    }
    dotsContainer.style.display = "none";
  } else {
    resetDotStyles();
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
