const CONTACT_EMAIL = "mauricio.fuentes.ab@gmail.com";

export function initContactModal() {
  const modal = document.querySelector("[data-contact-modal]");
  const openButton = document.querySelector("[data-contact-open]");
  const closeButton = document.querySelector("[data-contact-close]");
  const copyButton = document.querySelector("[data-contact-copy]");
  const feedback = document.querySelector("[data-contact-feedback]");
  let feedbackTimeoutId = null;

  if (!modal || !openButton || !closeButton || !copyButton || !feedback) {
    return;
  }

  const setFeedback = (message) => {
    feedback.textContent = message;
  };

  const resetCopyState = () => {
    if (feedbackTimeoutId) {
      window.clearTimeout(feedbackTimeoutId);
      feedbackTimeoutId = null;
    }

    setFeedback("");
  };

  const openModal = () => {
    resetCopyState();
    if (typeof modal.showModal === "function") {
      modal.showModal();
      return;
    }

    modal.setAttribute("open", "true");
  };

  const closeModal = () => {
    resetCopyState();
    modal.close?.();
    modal.removeAttribute("open");
  };

  openButton.addEventListener("click", openModal);
  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    const surface = modal.querySelector(".contact-modal__surface");

    if (surface && !surface.contains(event.target)) {
      closeModal();
    }
  });

  modal.addEventListener("cancel", () => {
    resetCopyState();
  });

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setFeedback("Correo copiado");
      if (feedbackTimeoutId) {
        window.clearTimeout(feedbackTimeoutId);
      }
      feedbackTimeoutId = window.setTimeout(() => {
        setFeedback("");
        feedbackTimeoutId = null;
      }, 2200);
    } catch (error) {
      console.error("No se pudo copiar el correo:", error);
      setFeedback("No se pudo copiar");
    }
  });
}
