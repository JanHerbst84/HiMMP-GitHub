import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/*
 * Findings figure with a web-sized WebP derivative.
 *
 * `scripts/optimize-figures.mjs` writes `findings/Figures/web/<name>.webp`
 * plus a manifest with the derivative's intrinsic size. This server
 * component renders
 *
 *   <a href=original><picture><source webp><img src=original …></picture></a>
 *
 * so browsers download the small WebP, the original stays the fallback and
 * one click away at full resolution, and `width`/`height` reserve the
 * layout box. The `img` keeps the original `src`, so existing selectors
 * such as `img[src$=".png"]` (dark-mode paper backing for diagrams) still
 * apply. A figure missing from the manifest fails the build: run
 * `npm run figures:optimize`.
 */
type FigureManifestEntry = { webp: string; width: number; height: number };

const repoRoot = path.resolve(process.cwd(), "..");
const manifest: Record<string, FigureManifestEntry> = JSON.parse(
  readFileSync(path.join(repoRoot, "findings/Figures/web/manifest.json"), "utf8")
).figures;

type ChapterFigureProps = {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
};

export function ChapterFigure({ src, alt, className, loading = "lazy" }: ChapterFigureProps) {
  const match = src.match(/^(.*Figures\/)([^/]+)$/);
  const entry = match ? manifest[match[2]] : undefined;
  if (!match || !entry) {
    throw new Error(`No WebP derivative for figure ${src}; run npm run figures:optimize`);
  }
  if (!existsSync(path.join(repoRoot, entry.webp))) {
    throw new Error(`Missing WebP derivative ${entry.webp}; run npm run figures:optimize`);
  }
  const webpSrc = `${match[1]}web/${path.basename(entry.webp)}`;

  return (
    <a className="figure-original-link" href={src} aria-label={`${alt} (full-resolution image)`}>
      <picture>
        <source type="image/webp" srcSet={webpSrc} />
        <img
          src={src}
          alt={alt}
          className={className}
          width={entry.width}
          height={entry.height}
          loading={loading}
          decoding="async"
        />
      </picture>
    </a>
  );
}
