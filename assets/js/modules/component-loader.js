import { componentPaths } from "../config/components.js";

export async function loadComponents() {
  while (true) {
    const mounts = Array.from(
      document.querySelectorAll("[data-component]:not([data-component-loaded])")
    );

    if (!mounts.length) {
      return;
    }

    await Promise.all(
      mounts.map(async (mount) => {
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
      })
    );
  }
}
