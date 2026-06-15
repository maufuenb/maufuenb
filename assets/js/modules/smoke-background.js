import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";

const PARTICLE_COUNT = 56;
const BASE_PARTICLE_SIZE = 460;
const DRIFT_SPEED = 14;
const LATERAL_SWAY = 8;

function createSmokeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  const gradients = [
    { x: 128, y: 138, radius: 112, alpha: 0.42 },
    { x: 92, y: 124, radius: 78, alpha: 0.32 },
    { x: 164, y: 114, radius: 72, alpha: 0.28 },
    { x: 126, y: 86, radius: 66, alpha: 0.24 },
    { x: 138, y: 176, radius: 74, alpha: 0.22 },
  ];

  gradients.forEach(({ x, y, radius, alpha }) => {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    gradient.addColorStop(0.38, `rgba(190, 245, 255, ${alpha * 0.78})`);
    gradient.addColorStop(0.72, `rgba(111, 238, 255, ${alpha * 0.28})`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  });

  return new THREE.CanvasTexture(canvas);
}

function getViewportBounds(camera) {
  const vFov = (camera.fov * Math.PI) / 180;
  const height = 2 * Math.tan(vFov / 2) * camera.position.z;
  const width = height * camera.aspect;

  return { width, height };
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export function initSmokeBackground() {
  const host = document.querySelector("[data-smoke-background]");

  if (
    !host ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(max-width: 1023px)").matches
  ) {
    return;
  }

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    58,
    window.innerWidth / window.innerHeight,
    1,
    3000
  );

  camera.position.z = 900;

  const texture = createSmokeTexture();

  if (!texture) {
    return;
  }

  texture.needsUpdate = true;

  const geometry = new THREE.PlaneGeometry(BASE_PARTICLE_SIZE, BASE_PARTICLE_SIZE);
  const particles = [];
  const bounds = getViewportBounds(camera);

  const createMaterial = (color, opacity) =>
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity,
      color,
      blending: THREE.AdditiveBlending,
    });

  const resetParticle = (particle, resetToBottom = false) => {
    const startX = randomBetween(-bounds.width * 0.7, bounds.width * 0.7);
    const startY = resetToBottom
      ? randomBetween(-bounds.height * 0.9, -bounds.height * 0.55)
      : randomBetween(-bounds.height * 0.65, bounds.height * 0.35);

    particle.position.set(startX, startY, randomBetween(-260, 180));

    const scale = randomBetween(0.9, 1.7);
    particle.scale.set(scale, scale * randomBetween(0.72, 1.16), 1);
    particle.rotation.z = randomBetween(-Math.PI, Math.PI);
    particle.userData.rotationSpeed = randomBetween(-0.05, 0.05);
    particle.userData.riseSpeed = randomBetween(0.75, 1.55);
    particle.userData.driftSpeed = randomBetween(-1.1, 1.1);
    particle.userData.swayOffset = randomBetween(0, Math.PI * 2);
  };

  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    const color = new THREE.Color(
      index % 3 === 0 ? "#8af8ff" : index % 3 === 1 ? "#ff88dc" : "#c3a6ff"
    );
    const material = createMaterial(color, randomBetween(0.18, 0.34));
    const particle = new THREE.Mesh(geometry, material);

    resetParticle(particle);
    scene.add(particle);
    particles.push(particle);
  }

  renderer.domElement.setAttribute("aria-hidden", "true");
  host.replaceChildren(renderer.domElement);

  const clock = new THREE.Clock();
  let animationFrameId = null;

  const render = () => {
    const delta = Math.min(clock.getDelta(), 0.033);
    const elapsed = clock.elapsedTime;

    particles.forEach((particle) => {
      particle.rotation.z += particle.userData.rotationSpeed * delta;
      particle.position.y += particle.userData.riseSpeed * DRIFT_SPEED * delta;
      particle.position.x +=
        (particle.userData.driftSpeed * LATERAL_SWAY +
          Math.sin(elapsed * 0.42 + particle.userData.swayOffset) * 3.4) *
        delta;

      if (particle.position.y > bounds.height * 0.7) {
        resetParticle(particle, true);
      }
    });

    renderer.render(scene, camera);
    animationFrameId = window.requestAnimationFrame(render);
  };

  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const nextBounds = getViewportBounds(camera);
    bounds.width = nextBounds.width;
    bounds.height = nextBounds.height;
  };

  window.addEventListener("resize", handleResize, { passive: true });
  render();

  host.cleanupSmokeBackground = () => {
    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId);
    }

    window.removeEventListener("resize", handleResize);
    geometry.dispose();
    texture.dispose();
    particles.forEach((particle) => particle.material.dispose());
    renderer.dispose();
  };
}
