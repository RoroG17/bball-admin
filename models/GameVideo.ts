import { z } from "zod";

export const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export const GameVideoSchema = z.discriminatedUnion("kind", [
  /** Aucune vidéo (`null` ou vide). */
  z.object({ kind: z.literal("none") }),
  z.object({ kind: z.literal("youtube"), videoId: z.string().regex(YOUTUBE_VIDEO_ID) }),
  /** Texte saisi non reconnu comme une vidéo YouTube. */
  z.object({ kind: z.literal("invalid"), raw: z.string() }),
]);

export type GameVideo = z.infer<typeof GameVideoSchema>;
