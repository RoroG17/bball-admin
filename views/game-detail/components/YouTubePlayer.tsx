"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRightIcon } from "@/components/ui/icons/ArrowUpRightIcon";
import { PlayIcon } from "@/components/ui/icons/PlayIcon";
import { buildYouTubeEmbedUrl, buildYouTubeWatchUrl } from "@/lib/youtube";

type YouTubePlayerProps = {
  videoId: string;
  /** Titre de l'iframe (P13). */
  title: string;
};

/** Lecteur chargé au clic seulement : aucune requête vers YouTube avant (D5). */
export function YouTubePlayer({ videoId, title }: YouTubePlayerProps) {
  const [loaded, setLoaded] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (loaded) frameRef.current?.focus();
  }, [loaded]);

  const watchLink = (
    <a
      href={buildYouTubeWatchUrl(videoId)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-1.5 rounded-sm font-semibold text-rpb-bordeaux underline decoration-2 underline-offset-4 focus-ring hover:text-rpb-bordeaux-dark"
    >
      <ArrowUpRightIcon size={16} strokeWidth={2.2} className="shrink-0" />
      Regarder sur YouTube
      <span className="sr-only"> (s&apos;ouvre dans un nouvel onglet)</span>
    </a>
  );

  if (loaded) {
    return (
      <div className="flex flex-col items-start gap-2">
        <div className="aspect-video w-full max-w-[960px] overflow-hidden rounded-md border-2 border-rpb-ink bg-rpb-ink">
          <iframe
            ref={frameRef}
            src={buildYouTubeEmbedUrl(videoId)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="size-full"
          />
        </div>
        {watchLink}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <button
        type="button"
        onClick={() => setLoaded(true)}
        className="group lift flex aspect-video w-[220px] max-w-full shrink-0 flex-col items-center justify-center gap-2 rounded-md border-2 border-rpb-ink bg-rpb-bordeaux text-sm font-bold text-rpb-cream focus-ring"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-rpb-gold text-rpb-ink transition-transform group-hover:scale-110">
          <PlayIcon size={22} filled />
        </span>
        Lire la vidéo
      </button>
      <div className="flex min-w-0 flex-[1_1_240px] flex-col items-start gap-1">
        <p className="text-[15px]/[22px] font-semibold">{title}</p>
        <p className="text-[13px]/[18px] text-rpb-ink/72">La lecture charge le lecteur YouTube.</p>
        {watchLink}
      </div>
    </div>
  );
}
