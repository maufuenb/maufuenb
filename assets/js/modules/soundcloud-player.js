import {
  soundCloudPlaylist,
  soundCloudPlayerOptions,
} from "../config/soundcloud.js";

const SOUNDCLOUD_WIDGET_API_URL = "https://w.soundcloud.com/player/api.js";
const TONEARM_REST_ANGLE = -80;
const TONEARM_START_ANGLE = -75;
const TONEARM_END_ANGLE = -37;
const TONEARM_PROGRESS_CURVE = 1.65;
const PROGRESS_POLL_MS = 750;
const DISC_TARGET_SPEED = 200;
const DISC_START_ACCELERATION = 220;
const DISC_STOP_ACCELERATION = 360;
const AUTOPLAY_TOAST_DELAY_MS = 2200;
const AUTOPLAY_TOAST_DURATION_MS = 3000;
const PLAY_RETRY_DELAY_MS = 900;

function getRandomTrackIndex() {
  return Math.floor(Math.random() * soundCloudPlaylist.length);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getTonearmProgress(progress) {
  const safeProgress = clamp(progress, 0, 1);
  return safeProgress ** TONEARM_PROGRESS_CURVE;
}

function loadSoundCloudScript() {
  if (window.SC?.Widget) {
    return Promise.resolve(window.SC);
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      `script[src="${SOUNDCLOUD_WIDGET_API_URL}"]`
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.SC), {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("No se pudo cargar la API de SoundCloud.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = SOUNDCLOUD_WIDGET_API_URL;
    script.async = true;
    script.onload = () => resolve(window.SC);
    script.onerror = () =>
      reject(new Error("No se pudo cargar la API de SoundCloud."));
    document.head.appendChild(script);
  });
}

function waitForWidgetReady(widget, SC) {
  return new Promise((resolve) => {
    widget.bind(SC.Widget.Events.READY, resolve);
  });
}

function updateTrackUi(track) {
  const titleTarget = document.querySelector("[data-soundcloud-title]");
  const artistTarget = document.querySelector("[data-soundcloud-artist]");
  const linkTargets = document.querySelectorAll("[data-soundcloud-link]");

  if (titleTarget) {
    titleTarget.textContent = track.title;
  }

  if (artistTarget) {
    artistTarget.textContent = track.artist;
  }

  linkTargets.forEach((link) => {
    link.href = track.url;
  });
}

function updateArtwork(sound) {
  const artworkTarget = document.querySelector("[data-soundcloud-artwork]");

  if (!artworkTarget) {
    return;
  }

  const artworkUrl = sound?.artwork_url || sound?.user?.avatar_url || "";

  if (!artworkUrl) {
    artworkTarget.style.backgroundImage = "";
    return;
  }

  const largeArtworkUrl = artworkUrl.replace("-large", "-t500x500");
  artworkTarget.style.backgroundImage = `url("${largeArtworkUrl}")`;
}

function syncCurrentSound(widget) {
  widget.getCurrentSound((sound) => {
    if (!sound) {
      return;
    }

    updateArtwork(sound);
  });
}

function setTonearmAngle(angle) {
  const tonearm = document.querySelector("[data-soundcloud-tonearm]");

  if (!tonearm) {
    return;
  }

  tonearm.style.transform = `rotate(${angle}deg)`;
}

function setDiscRotation(angle) {
  const disc = document.querySelector("[data-soundcloud-disc]");

  if (!disc) {
    return;
  }

  disc.style.setProperty("--disc-rotation", `${angle}deg`);
}

function updateTonearmProgress(progress, { isResting = false } = {}) {
  if (isResting) {
    setTonearmAngle(TONEARM_REST_ANGLE);
    return TONEARM_REST_ANGLE;
  }

  const safeProgress = getTonearmProgress(progress);
  const angleRange = TONEARM_END_ANGLE - TONEARM_START_ANGLE;
  const currentAngle = TONEARM_START_ANGLE + angleRange * safeProgress;

  setTonearmAngle(currentAngle);
  return currentAngle;
}

function updatePlayButton(isPlaying) {
  const playButton = document.querySelector("[data-soundcloud-play]");

  if (!playButton) {
    return;
  }

  playButton.dataset.state = isPlaying ? "playing" : "paused";
  playButton.setAttribute(
    "aria-label",
    isPlaying ? "Pausar reproduccion" : "Reproducir"
  );
  playButton.innerHTML = isPlaying
    ? '<span aria-hidden="true">❚❚</span>'
    : '<span aria-hidden="true">▶</span>';
}

function setPlayerStatus(message) {
  const statusTarget = document.querySelector("[data-soundcloud-status]");

  if (!statusTarget) {
    return;
  }

  statusTarget.textContent = message;
}

function showAppToast(message, duration = AUTOPLAY_TOAST_DURATION_MS) {
  const toast = document.querySelector("[data-app-toast]");

  if (!toast) {
    return;
  }

  if (toast.hideTimeoutId) {
    window.clearTimeout(toast.hideTimeoutId);
  }

  toast.hidden = false;
  toast.textContent = message;
  window.requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });

  toast.hideTimeoutId = window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => {
      toast.hidden = true;
      toast.textContent = "";
    }, 280);
  }, duration);
}

export async function initSoundCloudPlayer() {
  const iframe = document.querySelector("[data-soundcloud-iframe]");
  const prevButton = document.querySelector("[data-soundcloud-prev]");
  const playButton = document.querySelector("[data-soundcloud-play]");
  const nextButton = document.querySelector("[data-soundcloud-next]");
  const volumeInput = document.querySelector("[data-soundcloud-volume]");

  if (
    !iframe ||
    !prevButton ||
    !playButton ||
    !nextButton ||
    !volumeInput ||
    !soundCloudPlaylist.length
  ) {
    return;
  }

  const SC = await loadSoundCloudScript();
  const widget = SC.Widget(iframe);

  let currentTrackIndex = 0;
  let currentProgress = 0;
  let progressIntervalId = null;
  let discRotation = 0;
  let discSpeed = 0;
  let discTargetSpeed = 0;
  let discAnimationFrameId = null;
  let discLastFrameTime = null;
  let hasUserInteracted = false;
  let hasPlaybackStarted = false;
  let autoplayFallbackTimeoutId = null;
  let hasShownAutoplayToast = false;
  let activeLoadRequestId = 0;
  let playRetryTimeoutId = null;
  let isPlaying = false;
  const initialTrackIndex = getRandomTrackIndex();
  const disc = document.querySelector("[data-soundcloud-disc]");

  const clearAutoplayFallbackTimeout = () => {
    if (autoplayFallbackTimeoutId !== null) {
      window.clearTimeout(autoplayFallbackTimeoutId);
      autoplayFallbackTimeoutId = null;
    }
  };

  const clearPlayRetryTimeout = () => {
    if (playRetryTimeoutId !== null) {
      window.clearTimeout(playRetryTimeoutId);
      playRetryTimeoutId = null;
    }
  };

  const scheduleAutoplayFallbackToast = () => {
    clearAutoplayFallbackTimeout();

    autoplayFallbackTimeoutId = window.setTimeout(() => {
      if (hasPlaybackStarted || hasUserInteracted || hasShownAutoplayToast) {
        return;
      }

      hasShownAutoplayToast = true;
      showAppToast(
        "Para una experiencia mas inmersiva en la web, activa el reproductor y deja que acompane el recorrido."
      );
    }, AUTOPLAY_TOAST_DELAY_MS);
  };

  const stopDiscAnimation = () => {
    if (discAnimationFrameId !== null) {
      window.cancelAnimationFrame(discAnimationFrameId);
      discAnimationFrameId = null;
    }
    discLastFrameTime = null;
  };

  const animateDisc = (timestamp) => {
    if (discLastFrameTime === null) {
      discLastFrameTime = timestamp;
    }

    const deltaSeconds = (timestamp - discLastFrameTime) / 1000;
    discLastFrameTime = timestamp;

    const accelerating = discTargetSpeed > discSpeed;
    const acceleration = accelerating
      ? DISC_START_ACCELERATION
      : DISC_STOP_ACCELERATION;
    const speedDelta = acceleration * deltaSeconds;

    if (accelerating) {
      discSpeed = Math.min(discSpeed + speedDelta, discTargetSpeed);
    } else {
      discSpeed = Math.max(discSpeed - speedDelta, discTargetSpeed);
    }

    discRotation = (discRotation + discSpeed * deltaSeconds) % 360;
    setDiscRotation(discRotation);

    if (disc) {
      disc.classList.toggle("music-disc--active", discSpeed > 1);
    }

    if (discSpeed === 0 && discTargetSpeed === 0) {
      stopDiscAnimation();
      return;
    }

    discAnimationFrameId = window.requestAnimationFrame(animateDisc);
  };

  const setDiscPlaying = (isPlaying) => {
    discTargetSpeed = isPlaying ? DISC_TARGET_SPEED : 0;

    if (discAnimationFrameId === null) {
      discAnimationFrameId = window.requestAnimationFrame(animateDisc);
    }
  };

  const stopProgressSync = () => {
    if (progressIntervalId !== null) {
      window.clearInterval(progressIntervalId);
      progressIntervalId = null;
    }
  };

  const syncPlaybackProgress = () => {
    widget.getDuration((duration) => {
      if (!duration) {
        return;
      }

      widget.getPosition((position) => {
        currentProgress = clamp(position / duration, 0, 1);
        updateTonearmProgress(currentProgress);
      });
    });
  };

  const startProgressSync = () => {
    stopProgressSync();
    syncPlaybackProgress();
    progressIntervalId = window.setInterval(syncPlaybackProgress, PROGRESS_POLL_MS);
  };

  const requestPlayback = ({ retry = false } = {}) => {
    widget.play();

    if (!retry) {
      clearPlayRetryTimeout();
      playRetryTimeoutId = window.setTimeout(() => {
        if (!isPlaying) {
          requestPlayback({ retry: true });
        }
      }, PLAY_RETRY_DELAY_MS);
    }
  };

  const loadTrack = async (
    trackIndex,
    { autoplay = false, showAutoplayFallbackToast = false } = {}
  ) => {
    const loadRequestId = ++activeLoadRequestId;
    const track = soundCloudPlaylist[trackIndex];
    const shouldAutoplay = autoplay;

    currentTrackIndex = trackIndex;
    currentProgress = 0;
    stopProgressSync();
    clearPlayRetryTimeout();
    isPlaying = false;
    setDiscPlaying(false);
    updateTrackUi(track);
    updateTonearmProgress(0, { isResting: true });
    updatePlayButton(false);
    setPlayerStatus("Cargando desde SoundCloud...");

    widget.load(track.url, {
      ...soundCloudPlayerOptions,
      auto_play: shouldAutoplay,
      callback: () => {
        if (loadRequestId !== activeLoadRequestId) {
          return;
        }

        widget.setVolume(Number(volumeInput.value));
        syncCurrentSound(widget);

        if (shouldAutoplay) {
          setPlayerStatus("Preparando reproduccion...");
          requestPlayback();
        } else {
          setPlayerStatus("Listo para reproducir");
        }

        if (showAutoplayFallbackToast && shouldAutoplay) {
          scheduleAutoplayFallbackToast();
        }
      },
    });
  };

  await waitForWidgetReady(widget, SC);
  setTonearmAngle(TONEARM_REST_ANGLE);
  setDiscRotation(0);
  updatePlayButton(false);
  setPlayerStatus("Cargando track aleatorio...");
  await loadTrack(initialTrackIndex, {
    autoplay: true,
    showAutoplayFallbackToast: true,
  });

  widget.bind(SC.Widget.Events.PLAY, () => {
    clearPlayRetryTimeout();
    isPlaying = true;
    hasPlaybackStarted = true;
    clearAutoplayFallbackTimeout();
    syncCurrentSound(widget);
    updatePlayButton(true);
    updateTonearmProgress(currentProgress);
    setDiscPlaying(true);
    startProgressSync();
    setPlayerStatus("Reproduciendo en SoundCloud");
  });

  widget.bind(SC.Widget.Events.PAUSE, () => {
    clearPlayRetryTimeout();
    isPlaying = false;
    stopProgressSync();
    updatePlayButton(false);
    setDiscPlaying(false);
    setPlayerStatus("En pausa");
  });

  widget.bind(SC.Widget.Events.PLAY_PROGRESS, (event) => {
    const duration = event?.duration ?? 0;
    const currentPosition = event?.currentPosition ?? 0;

    if (!duration) {
      return;
    }

    currentProgress = clamp(currentPosition / duration, 0, 1);
    updateTonearmProgress(currentProgress);
  });

  widget.bind(SC.Widget.Events.FINISH, () => {
    clearPlayRetryTimeout();
    isPlaying = false;
    stopProgressSync();
    currentProgress = 1;
    updateTonearmProgress(1);
    setDiscPlaying(false);
    const nextIndex = (currentTrackIndex + 1) % soundCloudPlaylist.length;
    const shouldAutoplay = soundCloudPlaylist.length > 1;

    loadTrack(nextIndex, { autoplay: shouldAutoplay });

    if (!shouldAutoplay) {
      updatePlayButton(false);
      setPlayerStatus("Listo para volver a sonar");
    }
  });

  playButton.addEventListener("click", () => {
    hasUserInteracted = true;
    clearAutoplayFallbackTimeout();
    clearPlayRetryTimeout();

    if (isPlaying) {
      widget.pause();
      return;
    }

    setPlayerStatus("Preparando reproduccion...");
    requestPlayback();
  });

  prevButton.addEventListener("click", () => {
    hasUserInteracted = true;
    clearAutoplayFallbackTimeout();
    hasPlaybackStarted = true;
    const prevIndex =
      (currentTrackIndex - 1 + soundCloudPlaylist.length) %
      soundCloudPlaylist.length;
    loadTrack(prevIndex, { autoplay: true });
  });

  nextButton.addEventListener("click", () => {
    hasUserInteracted = true;
    clearAutoplayFallbackTimeout();
    hasPlaybackStarted = true;
    const nextIndex = (currentTrackIndex + 1) % soundCloudPlaylist.length;
    loadTrack(nextIndex, { autoplay: true });
  });

  volumeInput.addEventListener("input", () => {
    hasUserInteracted = true;
    clearAutoplayFallbackTimeout();
    widget.setVolume(Number(volumeInput.value));
  });

  setPlayerStatus("Selecciona play para comenzar");
}
