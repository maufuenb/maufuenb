const DEFAULT_THRESHOLD = 0.16;

export function initRevealAnimations() {
  const revealElements = document.querySelectorAll(".reveal");

  if (!revealElements.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: DEFAULT_THRESHOLD,
    }
  );

  revealElements.forEach((element) => {
    observer.observe(element);
  });
}
