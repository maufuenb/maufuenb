export function initBeyondLightbox() {
  const modal = document.querySelector("[data-beyond-lightbox]");
  const triggers = Array.from(document.querySelectorAll("[data-beyond-photo-trigger]"));
  const closeButton = document.querySelector("[data-beyond-lightbox-close]");
  const image = document.querySelector("[data-beyond-lightbox-image]");
  const title = document.querySelector("[data-beyond-lightbox-title]");
  const caption = document.querySelector("[data-beyond-lightbox-caption]");

  if (!modal || !triggers.length || !closeButton || !image || !title || !caption) {
    return;
  }

  const openModal = (trigger) => {
    image.src = trigger.dataset.beyondPhotoSrc || "";
    image.alt = trigger.dataset.beyondPhotoAlt || "";
    title.textContent = trigger.dataset.beyondPhotoTitle || "";
    caption.textContent = trigger.dataset.beyondPhotoCaption || "";

    if (typeof modal.showModal === "function") {
      modal.showModal();
      return;
    }

    modal.setAttribute("open", "true");
  };

  const closeModal = () => {
    modal.close?.();
    modal.removeAttribute("open");
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => openModal(trigger));
  });

  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    const surface = modal.querySelector(".beyond-lightbox__surface");

    if (surface && !surface.contains(event.target)) {
      closeModal();
    }
  });
}
