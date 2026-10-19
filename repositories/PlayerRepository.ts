import "server-only";
import { cache } from "react";
import { apiGet } from "@/lib/http";
import { dedupeByLicence } from "@/models/dedupeByLicence";
import type { Player } from "@/models/Player";
import type { PlayerListEntry } from "@/models/PlayerListEntry";
import type { PlayerProfile } from "@/models/PlayerProfile";
import { sortPlayerListEntries } from "@/models/sortPlayerListEntries";
import { sortPlayersByName } from "@/models/sortPlayersByName";
import { RosterSliceDto } from "@/repositories/dto/HomeSlicesDto";
import { AllPlayersDto, SeasonPlayersDto } from "@/repositories/dto/PlayerListDto";
import { PlayerProfileSliceDto, PlayerProfileWithPersonalSliceDto } from "@/repositories/dto/PlayerProfileDto";
import { getCurrentSession } from "@/repositories/SessionRepository";
import { fetchHomePayload } from "@/repositories/sources/homeSource";
import { fetchPlayerDetailPayload } from "@/repositories/sources/playerDetailSource";

/** Effectif de la saison, trié par nom puis prénom. */
export async function listSeasonRoster(seasonId: number): Promise<Player[]> {
  const slice = RosterSliceDto.parse(await fetchHomePayload(seasonId));
  return sortPlayersByName(slice.joueurs);
}

/** Joueurs inscrits sur la saison, sans doublon (`participer` n'a pas de clé, B4), triés par nom. */
export async function listSeasonPlayers(seasonId: number): Promise<PlayerListEntry[]> {
  const session = await getCurrentSession();
  const entries = SeasonPlayersDto.parse(await apiGet(`/api/saisons/${seasonId}/joueurs`, { token: session?.token }));
  return sortPlayerListEntries(dedupeByLicence(entries));
}

/**
 * Tous les joueurs de la base (admin seulement : contrôlé par la vue). Mémoïsée (aucun argument) : un seul appel HTTP
 * par requête si deux blocs la lisent (D-S13).
 */
export const listAllPlayers = cache(async (): Promise<PlayerListEntry[]> => {
  const session = await getCurrentSession();
  const entries = AllPlayersDto.parse(await apiGet("/api/joueurs", { token: session?.token }));
  return sortPlayerListEntries(dedupeByLicence(entries));
});

/**
 * Identité de la fiche. `null` si le joueur n'existe pas (404). Sans autorisation, la civilité et la date de naissance
 * ne sont même pas lues (P2). Format invalide → erreur de page (l'identité est indispensable).
 */
export async function getPlayerProfile(
  licence: string,
  options: { includePersonalInfo: boolean },
): Promise<PlayerProfile | null> {
  const payload = await fetchPlayerDetailPayload(licence);
  if (payload === null) return null;
  return (options.includePersonalInfo ? PlayerProfileWithPersonalSliceDto : PlayerProfileSliceDto).parse(payload);
}
