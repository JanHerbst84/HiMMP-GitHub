import type { Metadata } from "next";
import type { LegacyPageContent } from "@/src/site/legacy-content";
import rawMetadataOverrides from "@/src/site/metadata-overrides.json";

const defaultSocialImage = "https://himmp.net/assets/images/og-image.jpg";

type MetadataOverrides = {
  title: Record<string, string>;
  description: Record<string, string>;
  canonical: Record<string, string>;
  openGraphTitle: Record<string, string>;
  twitterTitle: Record<string, string>;
  openGraphUrl: Record<string, string>;
  openGraphImage: Record<string, string>;
  twitterImage: Record<string, string>;
};

const metadataOverrides: MetadataOverrides = rawMetadataOverrides;

function titleFor(content: LegacyPageContent): string {
  return metadataOverrides.title[content.sourceFile] ?? content.title;
}

function descriptionFor(content: LegacyPageContent): string | null {
  return metadataOverrides.description[content.sourceFile] ?? content.description;
}

function canonicalFor(content: LegacyPageContent): string | undefined {
  return metadataOverrides.canonical[content.sourceFile] ?? content.canonical;
}

/*
 * Social titles: an explicit override wins; otherwise a page whose <title>
 * is overridden uses that new title (so the legacy social title cannot
 * drift from it); otherwise the legacy og:/twitter: title, then the title.
 */
function openGraphTitleFor(content: LegacyPageContent): string {
  const override = metadataOverrides.openGraphTitle[content.sourceFile];
  if (override) return override;
  if (metadataOverrides.title[content.sourceFile]) return titleFor(content);
  return content.openGraph.title ?? titleFor(content);
}

function twitterTitleFor(content: LegacyPageContent): string {
  const override = metadataOverrides.twitterTitle[content.sourceFile];
  if (override) return override;
  if (metadataOverrides.title[content.sourceFile]) return titleFor(content);
  return content.twitter.title ?? titleFor(content);
}

function openGraphDescriptionFor(content: LegacyPageContent): string | undefined {
  if (metadataOverrides.description[content.sourceFile]) return descriptionFor(content) ?? undefined;
  return content.openGraph.description ?? descriptionFor(content) ?? undefined;
}

function twitterDescriptionFor(content: LegacyPageContent): string | undefined {
  if (metadataOverrides.description[content.sourceFile]) return descriptionFor(content) ?? undefined;
  return content.twitter.description ?? descriptionFor(content) ?? undefined;
}

function openGraphUrlFor(content: LegacyPageContent): string | undefined {
  return (
    metadataOverrides.openGraphUrl[content.sourceFile] ??
    content.openGraph.url ??
    canonicalFor(content)
  );
}

function openGraphImageFor(content: LegacyPageContent): string | undefined {
  return (
    metadataOverrides.openGraphImage[content.sourceFile] ??
    content.openGraph.image ??
    defaultSocialImage
  );
}

function twitterImageFor(content: LegacyPageContent): string | undefined {
  return (
    metadataOverrides.twitterImage[content.sourceFile] ??
    content.twitter.image ??
    openGraphImageFor(content)
  );
}

export function legacyContentToMetadata(content: LegacyPageContent): Metadata {
  const title = titleFor(content);
  const description = descriptionFor(content);
  const openGraphImage = openGraphImageFor(content);
  const twitterImage = twitterImageFor(content);
  const metadata: Metadata = {
    title,
    description: description ?? undefined,
    robots: "index, follow, max-image-preview:large",
    alternates: {
      canonical: canonicalFor(content)
    }
  };

  if (Object.keys(content.openGraph).length || openGraphImage) {
    const openGraphType =
      content.openGraph.type === "article" || content.openGraph.type === "website"
        ? content.openGraph.type
        : undefined;

    metadata.openGraph = {
      ...(openGraphType ? { type: openGraphType } : {}),
      title: openGraphTitleFor(content),
      description: openGraphDescriptionFor(content),
      url: openGraphUrlFor(content),
      siteName: content.openGraph.site_name,
      images: openGraphImage ? [openGraphImage] : undefined,
      locale: content.openGraph.locale
    };
  }

  if (Object.keys(content.twitter).length || twitterImage) {
    metadata.twitter = {
      card: (content.twitter.card ?? "summary_large_image") as Metadata["twitter"] extends {
        card?: infer T;
      }
        ? T
        : never,
      title: twitterTitleFor(content),
      description: twitterDescriptionFor(content),
      images: twitterImage ? [twitterImage] : undefined
    };
  }

  return metadata;
}
