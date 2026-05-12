import type { Metadata } from "next";
import type { LegacyPageContent } from "@/src/site/legacy-content";
import metadataOverrides from "@/src/site/metadata-overrides.json";

function canonicalFor(content: LegacyPageContent): string | undefined {
  return (
    metadataOverrides.canonical[content.sourceFile as keyof typeof metadataOverrides.canonical] ??
    content.canonical
  );
}

function openGraphUrlFor(content: LegacyPageContent): string | undefined {
  return (
    metadataOverrides.openGraphUrl[content.sourceFile as keyof typeof metadataOverrides.openGraphUrl] ??
    content.openGraph.url
  );
}

export function legacyContentToMetadata(content: LegacyPageContent): Metadata {
  const metadata: Metadata = {
    title: content.title,
    description: content.description ?? undefined,
    alternates: {
      canonical: canonicalFor(content)
    }
  };

  if (Object.keys(content.openGraph).length) {
    const openGraphType =
      content.openGraph.type === "article" || content.openGraph.type === "website"
        ? content.openGraph.type
        : undefined;

    metadata.openGraph = {
      title: content.openGraph.title,
      description: content.openGraph.description,
      type: openGraphType,
      url: openGraphUrlFor(content),
      siteName: content.openGraph.site_name,
      images: content.openGraph.image ? [content.openGraph.image] : undefined,
      locale: content.openGraph.locale
    };
  }

  if (Object.keys(content.twitter).length) {
    metadata.twitter = {
      card: content.twitter.card as Metadata["twitter"] extends { card?: infer T } ? T : never,
      title: content.twitter.title,
      description: content.twitter.description,
      images: content.twitter.image ? [content.twitter.image] : undefined
    };
  }

  return metadata;
}
