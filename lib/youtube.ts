/** Seul endroit où les URL YouTube sont construites. Domaine sans cookie pour le lecteur (D5). */
export function buildYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;
}

export function buildYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}
