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

  return document.getElementById(id);
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

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  });
}
