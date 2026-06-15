import { githubProfile } from "../config/social.js";

function formatFollowers(value) {
  return new Intl.NumberFormat("es-CL").format(value);
}

function buildFollowersText(value, format) {
  const formattedValue = formatFollowers(value);

  if (format === "compact") {
    return `Seguidores · ${formattedValue}`;
  }

  return `${formattedValue} seguidores en GitHub`;
}

export async function initGitHubProfile() {
  const followerTargets = document.querySelectorAll("[data-github-followers]");
  const followLinks = document.querySelectorAll("[data-github-follow-link]");

  if (!followerTargets.length && !followLinks.length) {
    return;
  }

  followLinks.forEach((link) => {
    link.href = githubProfile.profileUrl;
  });

  try {
    const response = await fetch(githubProfile.apiUrl, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API respondió con estado ${response.status}`);
    }

    const profile = await response.json();

    followerTargets.forEach((target) => {
      const format = target.dataset.githubFollowersFormat;

      target.textContent = buildFollowersText(profile.followers, format);
      target.href = githubProfile.followersUrl;
      target.removeAttribute("aria-busy");
    });
  } catch (error) {
    console.error("No se pudo cargar el contador de GitHub:", error);

    followerTargets.forEach((target) => {
      const format = target.dataset.githubFollowersFormat;

      target.textContent = format === "compact"
        ? "Ver perfil"
        : "Ver seguidores en GitHub";
      target.href = githubProfile.followersUrl;
      target.removeAttribute("aria-busy");
    });
  }
}
