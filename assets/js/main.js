import { loadComponentBatch } from "./modules/component-loader.js";
import { initHeaderNav } from "./modules/header-nav.js";
import { initInternalNavigation } from "./modules/internal-navigation.js";
import { initRevealAnimations } from "./modules/reveal.js";

const CRITICAL_COMPONENTS = ["header", "hero", "profile", "footer"];
const DEFERRED_COMPONENTS = [
  "stack",
  "projects-public",
  "projects-products",
  "beyond",
  "feedback",
  "contact",
];

function runWhenIdle(callback, timeout = 1200) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout });
    return;
  }

  window.setTimeout(callback, 180);
}

function initDeferredDecorativeBackground() {
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(max-width: 1023px)").matches
  ) {
    return;
  }

  runWhenIdle(async () => {
    const { initSmokeBackground } = await import("./modules/smoke-background.js");
    initSmokeBackground();
  });
}

function initDeferredGitHubProfile() {
  runWhenIdle(async () => {
    const { initGitHubProfile } = await import("./modules/github-profile.js");
    await initGitHubProfile();
  }, 900);
}

function initHeaderOffsetSync() {
  const header = document.querySelector("[data-app-header]");

  if (!(header instanceof HTMLElement)) {
    return;
  }

  const syncHeaderOffset = () => {
    const headerHeight = Math.ceil(header.getBoundingClientRect().height);

    if (headerHeight <= 0) {
      return;
    }

    document.documentElement.style.setProperty("--header-offset", `${headerHeight}px`);
  };

  syncHeaderOffset();

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => {
      syncHeaderOffset();
    });

    resizeObserver.observe(header);
  }

  window.addEventListener("resize", syncHeaderOffset, { passive: true });
  window.addEventListener("load", syncHeaderOffset);
}

function initSoundCloudPlayerOnDemand() {
  const playerRoot = document.querySelector("[data-floating-player]");
  const footerPlayerLinks = Array.from(
    document.querySelectorAll('a[href="#reproductor-footer"]')
  );

  if (!playerRoot) {
    return;
  }

  let playerInitPromise = null;
  let playerInitialized = false;

  const replayPendingAction = (target) => {
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const control = target.closest(
      "[data-soundcloud-prev], [data-soundcloud-play], [data-soundcloud-next]"
    );

    if (control instanceof HTMLElement) {
      control.click();
      return;
    }

    if (target.matches("[data-soundcloud-volume]")) {
      target.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  const ensurePlayerReady = async (pendingTarget = null) => {
    if (!playerInitPromise) {
      playerInitPromise = import("./modules/soundcloud-player.js")
        .then(({ initSoundCloudPlayer }) => initSoundCloudPlayer())
        .then(() => {
          playerInitialized = true;
          playerRoot.dataset.playerState = "ready";
        })
        .catch((error) => {
          playerRoot.dataset.playerState = "error";
          playerInitPromise = null;
          throw error;
        });
    }

    await playerInitPromise;

    if (pendingTarget && playerInitialized) {
      window.requestAnimationFrame(() => {
        replayPendingAction(pendingTarget);
      });
    }
  };

  playerRoot.dataset.playerState = "idle";

  playerRoot.addEventListener(
    "pointerenter",
    () => {
      void ensurePlayerReady();
    },
    { once: true }
  );

  playerRoot.addEventListener(
    "focusin",
    () => {
      void ensurePlayerReady();
    },
    { once: true }
  );

  playerRoot.addEventListener(
    "pointerdown",
    (event) => {
      if (playerInitialized) {
        return;
      }

      void ensurePlayerReady(event.target);
    },
    { passive: true }
  );

  footerPlayerLinks.forEach((link) => {
    link.addEventListener("click", () => {
      void ensurePlayerReady();
    });
  });
}

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

window.scrollTo(0, 0);

window.addEventListener("pageshow", () => {
  window.scrollTo(0, 0);
});

async function initPage() {
  try {
    await loadComponentBatch(CRITICAL_COMPONENTS);

    const { initFooterDock } = await import("./modules/footer-dock.js");

    initHeaderOffsetSync();
    initHeaderNav();
    initInternalNavigation();
    initFooterDock();
    initRevealAnimations();
    initSoundCloudPlayerOnDemand();
    initDeferredGitHubProfile();
    initDeferredDecorativeBackground();

    loadComponentBatch(DEFERRED_COMPONENTS)
      .then(async () => {
        const [
          { initBeyondLightbox },
          { initContactModal },
          { initHorizontalDragScroll },
          { initProjectCardEffects },
          { initStackInteractions },
        ] = await Promise.all([
          import("./modules/beyond-lightbox.js"),
          import("./modules/contact-modal.js"),
          import("./modules/horizontal-drag-scroll.js"),
          import("./modules/projects.js"),
          import("./modules/stack.js"),
        ]);

        initBeyondLightbox();
        initContactModal();
        initHorizontalDragScroll();
        initRevealAnimations();
        initProjectCardEffects();
        initStackInteractions();
      })
      .catch((error) => {
        console.error("Error al cargar los componentes diferidos:", error);
      });
  } catch (error) {
    console.error("Error al inicializar la página:", error);
  }
}

initPage();
