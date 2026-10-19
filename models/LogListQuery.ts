import type { LogFilters } from "@/models/LogFilters";
import type { LogKind } from "@/models/LogKind";

/** Taille de page fixe, jamais modifiable depuis l'URL (P9). */
export const LOG_PAGE_SIZE = 50;
export const LOG_MAX_PAGE = 100_000;
/** Plafond d'affichage d'un message ou d'un contexte dans le détail (P2). */
export const LOG_DETAIL_MAX_CHARS = 20_000;
/** Troncature du message en liste. */
export const LOG_LIST_MESSAGE_CHARS = 120;

export type LogListQuery = {
  kind: LogKind;
  /** Uniquement des filtres ACTIFS pour ce type, valeurs valides. */
  filters: LogFilters;
  /** Entier ≥ 1. */
  page: number;
  /** Entrée dont le détail est ouvert. */
  detailId: number | null;
};
