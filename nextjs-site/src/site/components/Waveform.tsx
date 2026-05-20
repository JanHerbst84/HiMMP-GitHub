/*
 * D-6 phase-1 — procedural waveform strip (markup-only).
 *
 * Pure render component. Receives a pre-computed `heights` array
 * (number[] of percentages 0..100) and renders one `<span>` per
 * value with inline `style={{ height: 'X%' }}`. The generator
 * lives in `Waveform.server.ts` (server-only); this component
 * stays out of any "use client" boundary because consumers pass
 * the array as plain data.
 *
 * The strip is decorative: `aria-hidden="true"` on the container,
 * no `role` / no `aria-label`. Individual bars are also
 * `aria-hidden`. Screen readers skip it entirely (Codex review
 * confirmed announcing "Decorative audio waveform" before every
 * comparison player is accessibility noise).
 */

export type WaveformProps = {
  heights: number[];
  className?: string;
};

export function Waveform({ heights, className }: WaveformProps) {
  const classes = ["waveform-strip", className].filter(Boolean).join(" ");
  return (
    <div className={classes} data-waveform="static" aria-hidden="true">
      {heights.map((height, index) => (
        <span
          key={index}
          className="waveform-strip__bar"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}
