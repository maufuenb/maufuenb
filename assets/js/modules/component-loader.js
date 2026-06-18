import { componentPaths } from "../config/components.js";

function getPendingMounts() {
  return Array.from(
    document.querySelectorAll("[data-component]:not([data-component-loaded])")
  );
}

async function loadMount(mount) {
  const componentName = mount.dataset.component;
  const componentPath = componentPaths[componentName];

  if (!componentPath) {
    mount.dataset.componentLoaded = "true";
    return;
  }

  const response = await fetch(componentPath);

  if (!response.ok) {
    throw new Error(`No se pudo cargar el componente: ${componentName}`);
  }

  mount.innerHTML = await response.text();
  mount.dataset.componentLoaded = "true";
}

export async function loadComponentBatch(componentNames = []) {
  const mounts = getPendingMounts().filter((mount) =>
    componentNames.includes(mount.dataset.component)
  );

  if (!mounts.length) {
    return;
  }

  await Promise.all(mounts.map(loadMount));
}

export async function loadComponents() {
  const mounts = getPendingMounts();

  if (!mounts.length) {
    return;
  }

  await Promise.all(mounts.map(loadMount));
}
