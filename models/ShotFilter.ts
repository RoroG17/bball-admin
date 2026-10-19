/** Équipe dont on voit les tirs : la mienne ou l'adversaire (jamais mélangées). */
export type ShotSide = "team" | "opponent";

/** `null` = pas de filtre. `playerLicence` ne concerne que mon équipe. */
export type ShotFilter = { side: ShotSide; playerLicence: string | null; period: number | null };
