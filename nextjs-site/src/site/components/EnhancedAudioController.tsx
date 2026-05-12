"use client";

import { useEffect } from "react";

type AudioButton = HTMLButtonElement & {
  dataset: {
    src?: string;
    name?: string;
  };
};

type ComparisonBinding = {
  audio: HTMLAudioElement;
  buttons: AudioButton[];
  container: HTMLElement;
  display: HTMLElement | null;
  displayMode: "full-label" | "name-only";
};

function labelFor(button: AudioButton): string {
  return button.dataset.name?.trim() || button.textContent?.trim() || "Selected mix";
}

function sourceFor(button: AudioButton): string | null {
  return button.dataset.src?.trim() || null;
}

function currentPlaybackTime(audio: HTMLAudioElement): number {
  return Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
}

function setDisplay(display: HTMLElement | null, displayMode: ComparisonBinding["displayMode"], label: string) {
  if (!display) {
    return;
  }

  display.textContent = displayMode === "full-label" ? `Now Playing: ${label}` : label;
}

function setActiveButton(buttons: AudioButton[], activeButton: AudioButton) {
  for (const button of buttons) {
    const isActive = button === activeButton;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function ensureStatus(container: HTMLElement): HTMLElement {
  const existingStatus = container.querySelector<HTMLElement>("[data-enhanced-audio-status]");

  if (existingStatus) {
    return existingStatus;
  }

  const status = document.createElement("div");
  status.className = "enhanced-audio-status";
  status.dataset.enhancedAudioStatus = "";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  container.append(status);

  return status;
}

function setStatus(status: HTMLElement, state: "ready" | "loading" | "error", message: string) {
  status.dataset.state = state;
  status.textContent = message;
}

function bindComparisonPlayer(binding: ComparisonBinding): () => void {
  const { audio, buttons, container, display, displayMode } = binding;
  const status = ensureStatus(container);
  const cleanupCallbacks: Array<() => void> = [];
  let activeLabel = "";

  const initialButton = buttons.find((button) => button.classList.contains("active")) ?? buttons[0];
  if (initialButton) {
    const initialSource = sourceFor(initialButton);
    activeLabel = labelFor(initialButton);
    setActiveButton(buttons, initialButton);
    setDisplay(display, displayMode, activeLabel);
    setStatus(status, "ready", `Ready: ${activeLabel}`);

    if (initialSource && !audio.getAttribute("src")) {
      audio.setAttribute("src", initialSource);
    }
  }

  const handleAudioError = () => {
    if (activeLabel) {
      setStatus(status, "error", `Audio unavailable: ${activeLabel}`);
    }
  };
  audio.addEventListener("error", handleAudioError);
  cleanupCallbacks.push(() => audio.removeEventListener("error", handleAudioError));

  for (const button of buttons) {
    const handleClick = () => {
      const nextSource = sourceFor(button);
      const nextLabel = labelFor(button);

      if (!nextSource) {
        setStatus(status, "error", `Audio source missing: ${nextLabel}`);
        return;
      }

      const restoreTime = currentPlaybackTime(audio);
      const shouldResume = !audio.paused;

      activeLabel = nextLabel;
      setActiveButton(buttons, button);
      setDisplay(display, displayMode, nextLabel);
      setStatus(status, "loading", `Loading: ${nextLabel}`);

      const handleLoadedMetadata = () => {
        audio.currentTime = restoreTime;

        if (!shouldResume) {
          setStatus(status, "ready", `Ready: ${nextLabel}`);
          return;
        }

        void audio.play().then(
          () => setStatus(status, "ready", `Playing: ${nextLabel}`),
          () => setStatus(status, "ready", `Ready: ${nextLabel}`)
        );
      };

      audio.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true });
      audio.setAttribute("src", nextSource);
      audio.load();
    };

    button.addEventListener("click", handleClick);
    cleanupCallbacks.push(() => button.removeEventListener("click", handleClick));
  }

  return () => {
    for (const cleanup of cleanupCallbacks) {
      cleanup();
    }
  };
}

function collectComparisonBindings(): ComparisonBinding[] {
  const bindings: ComparisonBinding[] = [];
  const mainComparison = document.querySelector<HTMLElement>(".comparison-player-container");
  const mainAudio = mainComparison?.querySelector<HTMLAudioElement>("#comparison-player") ?? null;

  if (mainComparison && mainAudio) {
    const buttons = Array.from(mainComparison.querySelectorAll<AudioButton>(".mix-btn"));
    if (buttons.length) {
      bindings.push({
        audio: mainAudio,
        buttons,
        container: mainComparison,
        display: mainComparison.querySelector<HTMLElement>("#currently-playing"),
        displayMode: "full-label"
      });
    }
  }

  for (const container of document.querySelectorAll<HTMLElement>(".mix-comparison-player")) {
    const audio = container.querySelector<HTMLAudioElement>("audio");
    const buttons = Array.from(container.querySelectorAll<AudioButton>(".mix-button"));

    if (audio && buttons.length) {
      bindings.push({
        audio,
        buttons,
        container,
        display: container.querySelector<HTMLElement>(".current-mix-name"),
        displayMode: "name-only"
      });
    }
  }

  return bindings;
}

export function EnhancedAudioController() {
  useEffect(() => {
    const cleanups = collectComparisonBindings().map(bindComparisonPlayer);

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, []);

  return <div data-enhanced-audio-controller="ready" hidden />;
}
