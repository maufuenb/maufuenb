function toggleDocked(widget, shouldDock) {
  widget.classList.toggle("is-docked", shouldDock);
}

export function initFooterDock() {
  const MOBILE_BREAKPOINT = 1023;
  const footerShell = document.querySelector("[data-footer-shell]");
  const githubHost = document.querySelector("[data-floating-github-host]");
  const playerHost = document.querySelector("[data-floating-player-host]");
  const githubSlot = document.querySelector("[data-footer-github-slot]");
  const playerSlot = document.querySelector("[data-footer-player-slot]");
  const githubWidget = document.querySelector("[data-floating-github]");
  const playerWidget = document.querySelector("[data-floating-player]");

  if (
    !footerShell ||
    !githubHost ||
    !playerHost ||
    !githubSlot ||
    !playerSlot ||
    !githubWidget ||
    !playerWidget
  ) {
    return;
  }

  let isDocked = false;

  const moveWidget = (widget, target) => {
    if (widget.parentElement !== target) {
      target.appendChild(widget);
    }
  };

  const setDocked = (nextDocked) => {
    if (nextDocked === isDocked) {
      moveWidget(playerWidget, isDocked ? playerSlot : playerHost);
      return;
    }

    isDocked = nextDocked;

    if (isDocked) {
      moveWidget(githubWidget, githubSlot);
      moveWidget(playerWidget, playerSlot);
    } else {
      moveWidget(githubWidget, githubHost);
      moveWidget(playerWidget, playerHost);
    }

    toggleDocked(githubWidget, isDocked);
    toggleDocked(playerWidget, isDocked);
  };

  const syncDockState = () => {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      setDocked(true);
      return;
    }

    const rect = footerShell.getBoundingClientRect();
    const shouldDock = rect.top <= window.innerHeight - 120;
    setDocked(shouldDock);
  };

  window.addEventListener("scroll", syncDockState, { passive: true });
  window.addEventListener("resize", syncDockState);

  syncDockState();
}
