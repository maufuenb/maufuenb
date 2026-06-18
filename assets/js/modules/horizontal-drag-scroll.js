const DRAG_THRESHOLD = 10;
const CLICK_SUPPRESSION_MS = 350;

function bindHorizontalDrag(container) {
  if (!(container instanceof HTMLElement) || container.dataset.dragScrollBound === "true") {
    return;
  }

  container.dataset.dragScrollBound = "true";

  let activePointerId = null;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let startScrollLeft = 0;
  let isPointerDown = false;
  let isDragging = false;
  let suppressClickUntil = 0;

  const resetDragState = () => {
    isPointerDown = false;
    isDragging = false;
    activePointerId = null;
  };

  container.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    if (container.scrollWidth <= container.clientWidth + 4) {
      return;
    }

    isPointerDown = true;
    isDragging = false;
    activePointerId = event.pointerId;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    startScrollLeft = container.scrollLeft;
  });

  container.addEventListener("pointermove", (event) => {
    if (!isPointerDown || activePointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - pointerStartX;
    const deltaY = event.clientY - pointerStartY;

    if (!isDragging) {
      if (Math.abs(deltaX) < DRAG_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) {
        return;
      }

      isDragging = true;
      container.setPointerCapture?.(event.pointerId);
    }

    event.preventDefault();
    container.scrollLeft = startScrollLeft - deltaX;
  });

  const endDrag = () => {
    if (isDragging) {
      suppressClickUntil = window.performance.now() + CLICK_SUPPRESSION_MS;
    }

    resetDragState();
  };

  container.addEventListener("pointerup", (event) => {
    if (activePointerId !== event.pointerId) {
      return;
    }

    endDrag();
  });

  container.addEventListener("pointercancel", () => {
    resetDragState();
  });

  container.addEventListener("lostpointercapture", () => {
    resetDragState();
  });

  container.addEventListener(
    "click",
    (event) => {
      const interactiveTarget = event.target.closest("a, button");

      if (!interactiveTarget) {
        return;
      }

      if (window.performance.now() <= suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );
}

export function initHorizontalDragScroll() {
  const containers = document.querySelectorAll("[data-horizontal-drag]");

  containers.forEach((container) => {
    bindHorizontalDrag(container);
  });
}
