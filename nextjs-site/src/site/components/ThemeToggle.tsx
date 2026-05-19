"use client";

import { useEffect, useState } from "react";

/*
 * D-9-d theme toggle.
 *
 * Three states cycled on click: 'light' → 'dark' → 'system' → 'light'.
 * Persists to localStorage key `himmp-theme`. When 'system' is the
 * active state, the `data-theme` attribute on <html> is REMOVED so
 * the @media (prefers-color-scheme: dark) fallback in tokens.css
 * takes over.
 *
 * The early-init script in `app/layout.tsx` sets `data-theme` from
 * localStorage before first paint, so the toggle's initial state is
 * already on screen when this component hydrates. The toggle then
 * synchronises its internal React state from the same localStorage
 * value and starts handling clicks.
 */

type ThemeChoice = "light" | "dark" | "system";

const STORAGE_KEY = "himmp-theme";

function readStoredChoice(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* private browsing / disabled storage — fall through */
  }
  return "system";
}

function applyChoice(choice: ThemeChoice) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (choice === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", choice);
  }
}

function persistChoice(choice: ThemeChoice) {
  if (typeof window === "undefined") return;
  try {
    if (choice === "system") {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, choice);
    }
  } catch {
    /* swallow */
  }
}

function nextChoice(current: ThemeChoice): ThemeChoice {
  switch (current) {
    case "light":
      return "dark";
    case "dark":
      return "system";
    case "system":
      return "light";
  }
}

function labelFor(choice: ThemeChoice): string {
  switch (choice) {
    case "light":
      return "Switch theme (currently light)";
    case "dark":
      return "Switch theme (currently dark)";
    case "system":
      return "Switch theme (currently following system)";
  }
}

function glyphFor(choice: ThemeChoice): string {
  // Unicode glyphs: keep dependency-free. Each glyph is purely
  // decorative; the accessible label is via aria-label, and the
  // span is aria-hidden.
  switch (choice) {
    case "light":
      return "☀";
    case "dark":
      return "☾";
    case "system":
      return "◐";
  }
}

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>("system");
  // After hydration, read the stored choice (which the early-init
  // script in layout.tsx has already applied to <html>) so the
  // component's UI label matches reality.
  useEffect(() => {
    setChoice(readStoredChoice());
  }, []);

  function handleClick() {
    const next = nextChoice(choice);
    setChoice(next);
    applyChoice(next);
    persistChoice(next);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={handleClick}
      aria-label={labelFor(choice)}
      aria-pressed={choice === "dark"}
      data-theme-choice={choice}
    >
      <span aria-hidden="true">{glyphFor(choice)}</span>
    </button>
  );
}
