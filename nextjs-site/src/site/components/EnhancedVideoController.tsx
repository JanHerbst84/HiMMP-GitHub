"use client";

import { useEffect } from "react";

function videoIdFromEmbedUrl(src: string): string | null {
  try {
    const url = new URL(src);
    const match = url.pathname.match(/\/embed\/([^/?#]+)/);

    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function createThumbnail(src: string, title: string): HTMLImageElement | null {
  const videoId = videoIdFromEmbedUrl(src);

  if (!videoId) {
    return null;
  }

  const image = document.createElement("img");
  image.className = "lazy-video-trigger__thumb";
  image.dataset.lazyThumbnailSrc = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  image.setAttribute("aria-hidden", "true");
  image.dataset.videoTitle = title;

  return image;
}

function loadThumbnailWhenVisible(image: HTMLImageElement | null, target: Element): () => void {
  const src = image?.dataset.lazyThumbnailSrc;

  if (!image || !src) {
    return () => {};
  }

  const load = () => {
    if (!image.src) {
      image.src = src;
    }
  };

  if (!("IntersectionObserver" in window)) {
    load();
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        load();
        observer.disconnect();
      }
    },
    { rootMargin: "320px 0px" }
  );
  observer.observe(target);

  return () => observer.disconnect();
}

function enhanceVideoFrame(frame: HTMLIFrameElement): () => void {
  const src = frame.dataset.lazyYoutubeSrc;
  const container = frame.closest<HTMLElement>(".video-container") ?? frame.parentElement;

  if (!src || !container || container.dataset.lazyVideoReady === "true") {
    return () => {};
  }

  const title = frame.getAttribute("title")?.trim() || "HiMMP video";
  const trigger = document.createElement("button");
  const thumbnail = createThumbnail(src, title);
  const playIcon = document.createElement("span");

  container.dataset.lazyVideoReady = "true";
  container.classList.add("lazy-video-container");
  frame.classList.add("lazy-video-frame");
  frame.dataset.lazyState = "pending";
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("tabindex", "-1");

  trigger.type = "button";
  trigger.className = "lazy-video-trigger";
  trigger.setAttribute("aria-label", `Load video: ${title}`);
  playIcon.className = "lazy-video-trigger__icon";
  playIcon.setAttribute("aria-hidden", "true");

  if (thumbnail) {
    trigger.append(thumbnail);
  }
  trigger.append(playIcon);
  container.prepend(trigger);
  const cleanupThumbnail = loadThumbnailWhenVisible(thumbnail, container);

  const handleClick = () => {
    frame.src = src;
    frame.dataset.lazyState = "loaded";
    frame.removeAttribute("aria-hidden");
    frame.removeAttribute("tabindex");
    trigger.remove();
    frame.focus();
  };

  trigger.addEventListener("click", handleClick);

  return () => {
    cleanupThumbnail();
    trigger.removeEventListener("click", handleClick);
    trigger.remove();
    container.removeAttribute("data-lazy-video-ready");
  };
}

export function EnhancedVideoController() {
  useEffect(() => {
    const cleanups = Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe[data-lazy-youtube-src]")).map(
      enhanceVideoFrame
    );

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, []);

  return <div data-enhanced-video-controller="ready" hidden />;
}
