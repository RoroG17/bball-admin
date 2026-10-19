import { z } from "zod";
import { buildMediaUrl } from "@/lib/mediaUrl";
import { parsePlayingTime } from "@/models/parsePlayingTime";
import { REGULATION_PERIODS, type PeriodStats } from "@/models/PeriodStats";
import { PlayerGameStatsSchema } from "@/models/PlayerGameStats";
import { numeric } from "@/repositories/dto/numeric";

const COUNTERS = [
  "passes_decisives",
  "rebonds_offensifs",
  "rebonds_defensifs",
  "interceptions",
  "contres",
  "ballons_perdus",
  "fautes",
  "tirs_2pts_reussis",
  "tirs_2pts_manques",
  "tirs_3pts_reussis",
  "tirs_3pts_manques",
  "lancers_francs_reussis",
  "lancers_francs_rates",
  "passes_reussies",
  "passes_rates",
] as const;

type Counter = (typeof COUNTERS)[number];

const PERIODS = Array.from({ length: REGULATION_PERIODS }, (_, index) => index + 1);
const field = (period: number, counter: Counter) => `q${period}_${counter}`;

/**
 * Forme des 60 compteurs `q{n}_…` d'une ligne `jouer`. Chaque compteur est obligatoire (clé absente = erreur lisible) ;
 * `null` = non saisi. Partagée par la fiche match et la fiche joueur.
 */
export const statCounterFields = Object.fromEntries(
  PERIODS.flatMap((period) => COUNTERS.map((counter) => [field(period, counter), numeric.nullable()])),
);

/** Compteurs `q{n}_…` validés → `periods[]` (Q1 à Q4). */
export function toPeriodStats(dto: object): PeriodStats[] {
  const counters = dto as Record<string, number | null>;
  const read = (period: number, counter: Counter) => counters[field(period, counter)];
  return PERIODS.map((period) => ({
    period,
    assists: read(period, "passes_decisives"),
    offensiveRebounds: read(period, "rebonds_offensifs"),
    defensiveRebounds: read(period, "rebonds_defensifs"),
    steals: read(period, "interceptions"),
    blocks: read(period, "contres"),
    turnovers: read(period, "ballons_perdus"),
    fouls: read(period, "fautes"),
    twoPoints: { made: read(period, "tirs_2pts_reussis"), missed: read(period, "tirs_2pts_manques") },
    threePoints: { made: read(period, "tirs_3pts_reussis"), missed: read(period, "tirs_3pts_manques") },
    freeThrows: { made: read(period, "lancers_francs_reussis"), missed: read(period, "lancers_francs_rates") },
    passes: { completed: read(period, "passes_reussies"), missed: read(period, "passes_rates") },
  }));
}

/**
 * Ligne de `stats[]` en LISTE BLANCHE : `z.object` retire civilité, date de naissance, données physiques,
 * équipe et tirs (P2). Les compteurs `q{n}_…` sont restructurés en `periods[]`.
 */
export const StatLineDto = z
  .object({
    id: numeric,
    licence: z.string().min(1),
    nom: z.string(),
    prenom: z.string(),
    photo: z.string().nullable().optional(),
    minutes: z.string().nullable(),
    ...statCounterFields,
  })
  .transform((dto) => ({
    lineId: dto.id,
    player: {
      licence: dto.licence,
      lastName: dto.nom,
      firstName: dto.prenom,
      photoUrl: buildMediaUrl("joueur", dto.photo),
    },
    playingTimeSeconds: parsePlayingTime(dto.minutes),
    periods: toPeriodStats(dto),
  }))
  .pipe(PlayerGameStatsSchema);

export const StatLinesSliceDto = z.object({ stats: z.array(StatLineDto) });

/** Nombre de lignes sans valider leur contenu (action « Saisir les stats »). */
export const StatCountSliceDto = z.object({ stats: z.array(z.unknown()) });
