export function initHeaderNav() {
  const NAV_COLLAPSE_BREAKPOINT = 1023;
  const header = document.querySelector("header");
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav-menu]");
  const dropdown = document.querySelector("[data-nav-dropdown]");
  const dropdownTrigger = document.querySelector("[data-nav-dropdown-trigger]");

  if (!header || !toggle || !nav) {
    return;
  }

  const closeDropdown = () => {
    if (!dropdown || !dropdownTrigger) {
      return;
    }

    dropdown.dataset.dropdownOpen = "false";
    dropdownTrigger.setAttribute("aria-expanded", "false");
  };

  const openDropdown = () => {
    if (!dropdown || !dropdownTrigger) {
      return;
    }

    dropdown.dataset.dropdownOpen = "true";
    dropdownTrigger.setAttribute("aria-expanded", "true");
  };

  const closeMenu = () => {
    header.dataset.navOpen = "false";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu principal");
    closeDropdown();
  };

  const openMenu = () => {
    header.dataset.navOpen = "true";
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Cerrar menu principal");
  };

  const syncDesktopState = () => {
    if (window.innerWidth > NAV_COLLAPSE_BREAKPOINT) {
      closeMenu();
      closeDropdown();
    }
  };

  toggle.addEventListener("click", () => {
    const isOpen = header.dataset.navOpen === "true";

    if (isOpen) {
      closeMenu();
      return;
    }

    openMenu();
  });

  if (dropdown && dropdownTrigger) {
    dropdownTrigger.addEventListener("click", (event) => {
      if (window.innerWidth > NAV_COLLAPSE_BREAKPOINT) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const isOpen = dropdown.dataset.dropdownOpen === "true";

      if (isOpen) {
        closeDropdown();
        return;
      }

      openDropdown();
    });
  }

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  window.addEventListener("resize", syncDesktopState);

  document.addEventListener("click", (event) => {
    if (window.innerWidth > NAV_COLLAPSE_BREAKPOINT || !dropdown) {
      return;
    }

    if (dropdown.contains(event.target) || toggle.contains(event.target)) {
      return;
    }

    closeDropdown();
  });

  closeMenu();
}
