"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

function toEmbedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?playsinline=1`;
  const shorts = url.match(/youtube\.com\/shorts\/([\w-]{11})/);
  if (shorts) return `https://www.youtube.com/embed/${shorts[1]}?playsinline=1`;
  return url;
}

export function VerticalVideoPlayer({
  url,
  active,
  className,
}: {
  url: string;
  active?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
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
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  return (
    <iframe
      src={toEmbedUrl(url)}
      className={cn("h-full w-full border-0", className)}
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
