function isSamePageHashLink(link) {
  if (!(link instanceof HTMLAnchorElement)) {
    return false;
  }

  const href = link.getAttribute("href");

  if (!href || !href.startsWith("#")) {
    return false;
  }

  return href.length > 1;
}

function getScrollTarget(hash) {
  const id = hash.slice(1);

  if (!id) {
    return null;
  }

  const container = document.getElementById(id);

  if (!container) {
    return null;
  }

  return container.querySelector("section") ?? container;
}

function getHeaderOffset() {
  const header = document.querySelector("[data-app-header]");
  const rootStyles = window.getComputedStyle(document.documentElement);
  const cssOffset = Number.parseFloat(rootStyles.getPropertyValue("--header-offset")) || 0;

  if (!(header instanceof HTMLElement)) {
    return cssOffset;
  }

  return Math.max(header.getBoundingClientRect().height, cssOffset);
}

function getSectionGap() {
  const rootStyles = window.getComputedStyle(document.documentElement);
  return Number.parseFloat(rootStyles.getPropertyValue("--section-scroll-gap")) || 0;
}

function scrollToTarget(target) {
  const headerOffset = getHeaderOffset();
  const sectionGap = getSectionGap();
  const targetTop = window.scrollY + target.getBoundingClientRect().top;
  const top = Math.max(targetTop - headerOffset - sectionGap, 0);

  window.scrollTo({
    top,
    behavior: "smooth",
  });
}

export function initInternalNavigation() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');

    if (!isSamePageHashLink(link)) {
      return;
    }

    const target = getScrollTarget(link.getAttribute("href"));

    if (!target) {
      return;
    }

    event.preventDefault();

    scrollToTarget(target);

    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  });
}
