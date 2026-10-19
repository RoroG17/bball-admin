import { type GameVideo, YOUTUBE_VIDEO_ID } from "@/models/GameVideo";

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const PATH_PREFIXES = ["embed", "shorts", "live"];

function extractVideoId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter((segment) => segment !== "");
  if (host === "youtu.be") return segments[0] ?? null;
  if (!YOUTUBE_HOSTS.has(host)) return null;
  if (segments[0] === "watch") return url.searchParams.get("v");
  if (segments.length >= 2 && PATH_PREFIXES.includes(segments[0])) return segments[1];
  return null;
}

/** Vidéo d'un match : identifiant seul ou URL YouTube (`watch?v=`, `youtu.be/`, `embed/`, `shorts/`, `live/`). */
export function parseGameVideo(raw: string | null): GameVideo {
  const value = raw?.trim() ?? "";
  if (value === "") return { kind: "none" };
  if (YOUTUBE_VIDEO_ID.test(value)) return { kind: "youtube", videoId: value };

  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return { kind: "invalid", raw: value };
  }
  const videoId = extractVideoId(url);
  return videoId !== null && YOUTUBE_VIDEO_ID.test(videoId) ? { kind: "youtube", videoId } : { kind: "invalid", raw: value };
}
