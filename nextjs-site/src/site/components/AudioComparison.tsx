"use client";

import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from "react";
import { comparisonMixes, type ComparisonMix } from "@/src/site/data/audio-comparison";

type StatusState = "ready" | "loading" | "error";
type StatusInfo = { state: StatusState; message: string };

const EMPTY_STATUS: StatusInfo = { state: "ready", message: "" };

function statusFor(state: StatusState, mix: ComparisonMix): StatusInfo {
  switch (state) {
    case "loading":
      return { state, message: `Loading: ${mix.displayName}` };
    case "error":
      return { state, message: `Audio unavailable: ${mix.displayName}` };
    case "ready":
    default:
      return { state, message: `Ready: ${mix.displayName}` };
  }
}

export function AudioComparison() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingResumeRef = useRef<{ time: number; play: boolean } | null>(null);
  const [activeId, setActiveId] = useState<string>(comparisonMixes[0].id);
  const [status, setStatus] = useState<StatusInfo>(EMPTY_STATUS);

  const activeMix = comparisonMixes.find((mix) => mix.id === activeId) ?? comparisonMixes[0];

  useEffect(() => {
    setStatus(statusFor("ready", comparisonMixes[0]));
  }, []);

  const handleSelect = useCallback(
    (mix: ComparisonMix) => {
      if (mix.id === activeId) {
        return;
      }

      const audio = audioRef.current;
      const restoreTime = audio && Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      const shouldResume = Boolean(audio && !audio.paused);

      pendingResumeRef.current = { time: restoreTime, play: shouldResume };

      setActiveId(mix.id);
      setStatus(statusFor("loading", mix));
    },
    [activeId]
  );

  useEffect(() => {
    if (!pendingResumeRef.current) {
      return;
    }
    audioRef.current?.load();
  }, [activeId]);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    const pending = pendingResumeRef.current;

    if (!audio) {
      return;
    }

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
    <section className="content-section" id="mix-comparison-tool">
      <div className="container">
        <h3>Interactive Mix Comparison Tool</h3>
        <p>
          Click any producer&apos;s name to instantly switch between mixes. The player will maintain the current playback
          position for seamless A/B comparison.
        </p>
        <div className="audio-comparison" data-audio-comparison="react">
          <div className="audio-comparison__panel">
            <p id="currently-playing" className="audio-comparison__display">
              Now Playing: {activeMix.displayName}
            </p>
            <audio
              ref={audioRef}
              id="comparison-player"
              controls
              src={activeMix.src}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleError}
              aria-label={`Mix comparison player — ${activeMix.displayName}`}
            />
            <div
              className="audio-comparison__buttons mix-buttons"
              role="group"
              aria-label="Select mix"
            >
              {comparisonMixes.map((mix) => {
                const isActive = mix.id === activeId;
                return (
                  <button
                    key={mix.id}
                    type="button"
                    className={`mix-btn${isActive ? " active" : ""}`}
                    data-src={mix.src}
                    data-name={mix.displayName}
                    aria-pressed={isActive}
                    onClick={() => handleSelect(mix)}
                  >
                    {mix.label}
                  </button>
                );
              })}
            </div>
            <div
              className="enhanced-audio-status"
              role="status"
              aria-live="polite"
              data-state={status.state}
            >
              {status.message}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
