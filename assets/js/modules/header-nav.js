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
  const observedSectionOrder = new Map(
    observedSections.map((section, index) => [section.id, index]),
  );
  let scrollSpyFrame = null;
  let manualActiveId = null;

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
      const href = link.getAttribute("href");

      if (href?.startsWith("#")) {
        manualActiveId = href.slice(1);
        setActiveLink(manualActiveId);
      }

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

  const updateActiveSectionFromScroll = () => {
    scrollSpyFrame = null;

    if (observedSections.length === 0) {
      return;
    }

    const headerBottom = header.getBoundingClientRect().bottom;
    const preferredLine = Math.round(window.innerHeight * 0.36);
    const activationLine = Math.max(headerBottom + 24, preferredLine);
    const firstObservedSection = observedSections[0];

    if (firstObservedSection) {
      const firstSectionTop = firstObservedSection.getBoundingClientRect().top;

      if (firstSectionTop > activationLine) {
        manualActiveId = null;
        setActiveLink(null);
        return;
      }
    }

    const sectionStates = observedSections.map((section) => {
      const rect = section.getBoundingClientRect();

      return {
        id: section.id,
        top: rect.top,
        bottom: rect.bottom,
        distanceToLine:
          rect.top <= activationLine && rect.bottom >= activationLine
            ? 0
            : Math.min(
                Math.abs(rect.top - activationLine),
                Math.abs(rect.bottom - activationLine),
              ),
      };
    });

    if (manualActiveId) {
      const manualIndex = observedSectionOrder.get(manualActiveId);
      const manualSection = sectionStates.find((section) => section.id === manualActiveId);
      const nextSection =
        manualIndex !== undefined ? sectionStates[manualIndex + 1] : null;

      if (manualSection) {
        const manualSectionStarted = manualSection.top <= activationLine + 120;
        const nextSectionHasTakenOver = Boolean(nextSection) && nextSection.top <= activationLine;

        if (manualSectionStarted && !nextSectionHasTakenOver) {
          setActiveLink(manualActiveId);
          return;
        }
      }

      manualActiveId = null;
    }

    const currentSection = sectionStates
      .slice()
      .sort((sectionA, sectionB) => {
        if (sectionA.distanceToLine !== sectionB.distanceToLine) {
          return sectionA.distanceToLine - sectionB.distanceToLine;
        }

        const sectionAContainsLine = sectionA.top <= activationLine && sectionA.bottom >= activationLine;
        const sectionBContainsLine = sectionB.top <= activationLine && sectionB.bottom >= activationLine;

        if (sectionAContainsLine !== sectionBContainsLine) {
          return sectionAContainsLine ? -1 : 1;
        }

        if (sectionA.top !== sectionB.top) {
          return Math.abs(sectionA.top - activationLine) - Math.abs(sectionB.top - activationLine);
        }

        return (
          (observedSectionOrder.get(sectionA.id) ?? Number.MAX_SAFE_INTEGER) -
          (observedSectionOrder.get(sectionB.id) ?? Number.MAX_SAFE_INTEGER)
        );
      })[0];

    if (currentSection) {
      setActiveLink(currentSection.id);
      return;
    }

    const nextSection = sectionStates.sort((sectionA, sectionB) => {
      if (sectionA.top !== sectionB.top) {
        return sectionA.top - sectionB.top;
      }

      return (
        (observedSectionOrder.get(sectionA.id) ?? Number.MAX_SAFE_INTEGER) -
        (observedSectionOrder.get(sectionB.id) ?? Number.MAX_SAFE_INTEGER)
      );
    })[0];

    if (nextSection) {
      setActiveLink(nextSection.id);
    }
  };

  const scheduleScrollSpyUpdate = () => {
    if (scrollSpyFrame !== null) {
      return;
    }

    scrollSpyFrame = window.requestAnimationFrame(updateActiveSectionFromScroll);
  };

  window.addEventListener("scroll", scheduleScrollSpyUpdate, { passive: true });
  window.addEventListener("resize", scheduleScrollSpyUpdate);
  window.addEventListener("load", scheduleScrollSpyUpdate);

  closeMenu();
  setActiveLink(null);
  scheduleScrollSpyUpdate();
}
