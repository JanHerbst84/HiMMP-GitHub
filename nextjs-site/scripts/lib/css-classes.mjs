/*
 * Shared property classifications used by the D-1 audit pipeline.
 * Extracted here so `audit-legacy-css.mjs`, `audit-d1-family-coverage.mjs`,
 * and `audit-token-coverage.mjs` consume one source of truth rather than
 * duplicate the sets. Keep these aligned with the families and rule kinds
 * named in `docs/nextjs-phase-2-d1-main-css-audit.md`.
 */

export const LAYOUT_PROPS = new Set([
  'display', 'position', 'width', 'height', 'min-width', 'min-height',
  'max-width', 'max-height', 'top', 'right', 'bottom', 'left',
  'flex', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
  'justify-content', 'align-items', 'align-self', 'align-content',
  'gap', 'row-gap', 'column-gap', 'order',
  'grid', 'grid-template', 'grid-template-columns', 'grid-template-rows',
  'grid-template-areas', 'grid-column', 'grid-row', 'grid-area',
  'grid-auto-flow', 'grid-auto-columns', 'grid-auto-rows', 'place-items', 'place-self',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'padding-block', 'padding-inline',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'margin-block', 'margin-inline',
  'overflow', 'overflow-x', 'overflow-y', 'overflow-wrap',
  'box-sizing', 'z-index', 'float', 'clear', 'transform', 'transform-origin',
  'aspect-ratio', 'isolation', 'inset'
]);

export const PALETTE_TYPE_PROPS = new Set([
  'color', 'background-color', 'background', 'background-image',
  'background-size', 'background-position', 'background-repeat',
  'font-family', 'font-size', 'font-weight', 'font-style',
  'line-height', 'letter-spacing', 'text-align', 'text-decoration',
  'text-transform', 'text-indent', 'text-shadow', 'word-spacing',
  'white-space', 'list-style', 'list-style-type'
]);

export const BORDER_PROPS = new Set([
  'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-color', 'border-style', 'border-width',
  'border-radius', 'border-top-left-radius', 'border-top-right-radius',
  'border-bottom-left-radius', 'border-bottom-right-radius',
  'outline', 'outline-color', 'outline-style', 'outline-width'
]);

export const VISUAL_POLISH_PROPS = new Set([
  'opacity', 'visibility', 'box-shadow', 'filter', 'backdrop-filter',
  'cursor', 'pointer-events', 'user-select', 'transition', 'animation',
  'animation-name', 'animation-duration', 'animation-timing-function',
  'animation-delay', 'animation-iteration-count', 'will-change',
  'scroll-behavior', 'content', 'object-fit', 'object-position'
]);

/*
 * Returns true for layout-structural properties only — those that
 * determine flow, box-model size via width/height/padding/margin,
 * flex/grid placement, or overflow. Border width, border radius, and
 * visual-polish properties are intentionally excluded. Rationale: the
 * D-1 structural-coverage gate's purpose is to verify flex/grid/flow
 * primitives are reproduced so the page does not collapse structurally
 * after legacy-stylesheet retirement. `main.css` uses `box-sizing:
 * border-box` globally, so `border-width` does not affect the visible
 * box footprint, and a deliberate token replacement for `border-radius`
 * (e.g. pill to hairline) should not produce a false coverage failure.
 * Border + visual-polish properties are covered by the separate
 * token-coverage audit (audit-token-coverage.mjs).
 */
export function isStructuralProp(property) {
  return LAYOUT_PROPS.has(property);
}

/*
 * Color-bearing properties for the token-coverage audit. A literal
 * colour value declared on any of these properties triggers a finding
 * unless explicitly whitelisted. Gradients and shorthands are scanned
 * by the audit's value-level parser rather than by property name.
 */
export const COLOR_BEARING_PROPS = new Set([
  'color', 'background', 'background-color', 'background-image',
  'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-color', 'border-top-color', 'border-right-color',
  'border-bottom-color', 'border-left-color',
  'outline', 'outline-color',
  'box-shadow', 'text-shadow',
  'fill', 'stroke',
  'text-decoration', 'text-decoration-color',
  'accent-color', 'caret-color',
  'column-rule', 'column-rule-color',
  'scrollbar-color'
]);
