"use client";

import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from "react";

/*
 * D-3-a — react component for the in-chapter mix-comparison-player
 * surface (chapters 7-10). Mirrors AudioComparison's pattern but
 * keeps the chapter-local "name-only" display mode (legacy text:
 * "Now Playing: <span class=current-mix-name>Producer</span>") and
 * the surrounding wrapper class `.mix-comparison-player` so existing
 * CSS (Family D structural decls migrated by Slice D) still applies.
 *
 * Replaces the EnhancedAudioController DOM-walk for these
 * `.mix-comparison-player` blocks. Class hooks preserved:
 *   .mix-comparison-player     (root container)
 *   .currently-playing         (display text)
 *   .current-mix-name          (display label span)
 *   .mix-button-group          (button container)
 *   .mix-button                (button)
 *   .mix-button.active         (active mix highlight)
 *   .embed-note                (optional bottom tip)
 *
 * `data-src` and `data-name` on each button are preserved too — they
 * are part of the controller-binding contract (used by Playwright
 * tests at static-export.spec.ts that assert mix switching).
 */

export type MixEntry = {
  src: string;
  label: string;
  name: string;
};

export type MixComparisonEmbedProps = {
  mixes: MixEntry[];
  note?: string;
};

type StatusState = "ready" | "loading" | "error";
type StatusInfo = { state: StatusState; message: string };

function statusFor(state: StatusState, mix: MixEntry): StatusInfo {
  switch (state) {
    case "loading":
      return { state, message: `Loading: ${mix.name}` };
    case "error":
      return { state, message: `Audio unavailable: ${mix.name}` };
    case "ready":
    default:
      return { state, message: `Ready: ${mix.name}` };
  }
}

export function MixComparisonEmbed({ mixes, note }: MixComparisonEmbedProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingResumeRef = useRef<{ time: number; play: boolean } | null>(null);
  const [activeSrc, setActiveSrc] = useState<string>(mixes[0].src);
  const [status, setStatus] = useState<StatusInfo>({ state: "ready", message: "" });

  const activeMix = mixes.find((m) => m.src === activeSrc) ?? mixes[0];

  useEffect(() => {
    setStatus(statusFor("ready", mixes[0]));
    // Mount-only: `mixes` is a static prop on every chapter; re-running
    // on identity change would overwrite an in-flight loading/error
    // status if the parent re-rendered with a fresh array literal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = useCallback(
    (mix: MixEntry) => {
      if (mix.src === activeSrc) {
        return;
      }
      const audio = audioRef.current;
      const restoreTime = audio && Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      const shouldResume = Boolean(audio && !audio.paused);
      pendingResumeRef.current = { time: restoreTime, play: shouldResume };
      setActiveSrc(mix.src);
      setStatus(statusFor("loading", mix));
    },
    [activeSrc]
  );

  useEffect(() => {
    if (!pendingResumeRef.current) {
      return;
    }
    audioRef.current?.load();
  }, [activeSrc]);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    const pending = pendingResumeRef.current;
    if (!audio) return;
    if (pending) {
      audio.currentTime = pending.time;
      pendingResumeRef.current = null;
      if (pending.play) {
        void audio.play().then(
          () => setStatus(statusFor("ready", activeMix)),
          () => setStatus(statusFor("ready", activeMix))
        );
        return;
      }
    }
    setStatus(statusFor("ready", activeMix));
  }, [activeMix]);

  const handleError = useCallback(
    (_event: SyntheticEvent<HTMLAudioElement>) => {
      setStatus(statusFor("error", activeMix));
    },
    [activeMix]
  );

  return (
    <div className="mix-comparison-player" data-mix-comparison-embed="react">
      <div className="currently-playing">
        Now Playing: <span className="current-mix-name">{activeMix.name}</span>
      </div>
      <audio
        ref={audioRef}
        controls
        preload="metadata"
        src={activeSrc}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
        aria-label={`Mix comparison player — ${activeMix.name}`}
      />
      <div className="mix-button-group" role="group" aria-label="Select mix">
        {mixes.map((mix) => {
          const isActive = mix.src === activeSrc;
          return (
            <button
              key={mix.src}
              type="button"
              className={`mix-button${isActive ? " active" : ""}`}
              data-src={mix.src}
              data-name={mix.name}
              aria-pressed={isActive}
              onClick={() => handleSelect(mix)}
            >
              {mix.label}
            </button>
          );
        })}
      </div>
      {note ? <div className="embed-note">{note}</div> : null}
      <div
        className="enhanced-audio-status"
        role="status"
        aria-live="polite"
        data-state={status.state}
        hidden={status.state === "ready" && !status.message}
      >
        {status.message}
      </div>
    </div>
  );
}
