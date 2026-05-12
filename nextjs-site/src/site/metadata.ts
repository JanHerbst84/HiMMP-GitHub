import type { Metadata } from "next";
import type { LegacyPageContent } from "@/src/site/legacy-content";
import rawMetadataOverrides from "@/src/site/metadata-overrides.json";

const defaultSocialImage = "https://himmp.net/assets/images/og-image.jpg";

type MetadataOverrides = {
  title: Record<string, string>;
  description: Record<string, string>;
  canonical: Record<string, string>;
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
      title: content.openGraph.title ?? title,
      description: content.openGraph.description ?? description ?? undefined,
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
      title: content.twitter.title ?? title,
      description: content.twitter.description ?? description ?? undefined,
      images: twitterImage ? [twitterImage] : undefined
    };
  }

  return metadata;
}
