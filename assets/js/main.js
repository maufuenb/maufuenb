import { loadComponents } from "./modules/component-loader.js";
import { initContactModal } from "./modules/contact-modal.js";
import { initFooterDock } from "./modules/footer-dock.js";
import { initHeaderNav } from "./modules/header-nav.js";
import { initGitHubProfile } from "./modules/github-profile.js";
import { initInternalNavigation } from "./modules/internal-navigation.js";
import { initRevealAnimations } from "./modules/reveal.js";
import { initProjectCardEffects } from "./modules/projects.js";
import { initSoundCloudPlayer } from "./modules/soundcloud-player.js";
import { initSmokeBackground } from "./modules/smoke-background.js";
import { initStackInteractions } from "./modules/stack.js";

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

window.scrollTo(0, 0);

window.addEventListener("pageshow", () => {
  window.scrollTo(0, 0);
});

async function initPage() {
  try {
    initSmokeBackground();
    await loadComponents();
    await initGitHubProfile();
    initHeaderNav();
    initInternalNavigation();
    initContactModal();
    initFooterDock();
    initRevealAnimations();
    initProjectCardEffects();
    initStackInteractions();
    initSoundCloudPlayer();
  } catch (error) {
    console.error("Error al inicializar la página:", error);
  }
}

initPage();
