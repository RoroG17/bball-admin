import { ADMIN_MESSAGES } from "@/models/adminMessages";
import { SEASON_MESSAGES } from "@/models/seasonMessages";
import type { WriteFailure } from "@/models/WriteFailure";

/** Échec d'écriture d'un participant en phrase française. Jamais la phrase du back. */
export function mapParticipantFailure(failure: WriteFailure): string {
  switch (failure.kind) {
    case "invalid":
    case "notFound":
      return SEASON_MESSAGES.participantGone;
    case "forbidden":
      return ADMIN_MESSAGES.forbidden;
    case "conflict":
      return ADMIN_MESSAGES.conflict;
    case "failed":
      return failure.reason === "network" ? ADMIN_MESSAGES.networkWrite : ADMIN_MESSAGES.serverWrite;
  }
}
