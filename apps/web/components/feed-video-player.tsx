"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function toEmbedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?playsinline=1&rel=0`;
  const shorts = url.match(/youtube\.com\/shorts\/([\w-]{11})/);
  if (shorts) return `https://www.youtube.com/embed/${shorts[1]}?playsinline=1&rel=0`;
  return url;
}

function isYouTube(url: string): boolean {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)/.test(url);
}

/**
 * Adaptive player for the class feed.
 * - File (.mp4/.webm/.ogg): fills the frame; vertical clips cover, horizontal
 *   clips letterbox (object-contain) so nothing gets cropped.
 * - YouTube links: embed at native landscape aspect, centered on the black feed.
 * - Other embeds (Bunny Stream, etc.): full frame.
 */
export function FeedVideoPlayer({
  url,
  active,
  className,
}: {
  url: string;
  active?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [portrait, setPortrait] = useState<boolean | null>(null);
  const isFile = /\.(mp4|webm|ogg)(\?|$)/i.test(url);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (active) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [active]);

  if (isFile) {
    return (
      <video
        ref={videoRef}
        src={url}
        playsInline
        loop
        muted={!active}
        controls={false}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          setPortrait(v.videoHeight >= v.videoWidth);
        }}
        className={cn(
          "h-full w-full bg-black",
          portrait === false ? "object-contain" : "object-cover",
          className,
        )}
      />
    );
  }

  if (isYouTube(url)) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <div className="aspect-video w-full max-w-full">
          <iframe
            src={toEmbedUrl(url)}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={toEmbedUrl(url)}
      className={cn("h-full w-full border-0 bg-black", className)}
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
