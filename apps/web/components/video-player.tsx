"use client";

function toEmbedUrl(url: string): string {
  // YouTube watch / short links -> embed
  const yt = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/,
  );
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return url;
}

export function VideoPlayer({ url }: { url: string }) {
  const isFile = /\.(mp4|webm|ogg)(\?|$)/i.test(url);

  if (isFile) {
    return (
      <video
        controls
        src={url}
        className="aspect-video w-full rounded-xl bg-black"
      />
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      <iframe
        src={toEmbedUrl(url)}
        className="h-full w-full"
        loading="lazy"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
