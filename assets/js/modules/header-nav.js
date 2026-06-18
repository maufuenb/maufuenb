export function initHeaderNav() {
  const NAV_COLLAPSE_BREAKPOINT = 1023;
  const header = document.querySelector("header");
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav-menu]");
  const dropdown = document.querySelector("[data-nav-dropdown]");
  const dropdownTrigger = document.querySelector("[data-nav-dropdown-trigger]");
  const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));

  if (!header || !toggle || !nav) {
    return;
  }

  const navItemsById = new Map(
    navLinks
      .map((link) => {
        const href = link.getAttribute("href");

        if (!href || !href.startsWith("#")) {
          return null;
        }

        return [href.slice(1), link];
      })
      .filter(Boolean),
  );

  const setActiveLink = (activeId) => {
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      const isActive = Boolean(href) && href === `#${activeId}`;

      link.dataset.navActive = isActive ? "true" : "false";

      if (isActive) {
        link.setAttribute("aria-current", "location");
        return;
      }

      link.removeAttribute("aria-current");
    });

    if (!dropdownTrigger) {
      return;
    }

    const isProjectSection = activeId === "proyectos-publicos" || activeId === "productos-propios";
    dropdownTrigger.dataset.navActive = isProjectSection ? "true" : "false";

    if (isProjectSection) {
      dropdownTrigger.setAttribute("aria-current", "location");
      return;
    }

    dropdownTrigger.removeAttribute("aria-current");
  };

  const observedSections = Array.from(navItemsById.keys())
    .map((id) => document.getElementById(id))
    .filter(Boolean);

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
    toggle.setAttribute("aria-label", "Abrir menú principal");
    closeDropdown();
  };

  const openMenu = () => {
    header.dataset.navOpen = "true";
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Cerrar menú principal");
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
    if (window.innerWidth > NAV_COLLAPSE_BREAKPOINT) {
      return;
    }

    if (header.contains(event.target)) {
      return;
    }

    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (window.innerWidth > NAV_COLLAPSE_BREAKPOINT) {
      closeDropdown();
      return;
    }

    closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (window.innerWidth > NAV_COLLAPSE_BREAKPOINT || !dropdown) {
      return;
    }

    if (dropdown.contains(event.target) || toggle.contains(event.target)) {
      return;
    }

    closeDropdown();
  });

  if (observedSections.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((entryA, entryB) => entryB.intersectionRatio - entryA.intersectionRatio);

        if (visibleEntries.length === 0) {
          return;
        }

        setActiveLink(visibleEntries[0].target.id);
      },
      {
        rootMargin: "-30% 0px -45% 0px",
        threshold: [0.2, 0.35, 0.5, 0.65],
      },
    );

    observedSections.forEach((section) => observer.observe(section));
  }

  closeMenu();
  setActiveLink("perfil");
}
