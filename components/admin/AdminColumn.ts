import type { ReactNode } from "react";

/** Colonne d'un `AdminTable`. `sticky` fige la colonne à gauche pendant le défilement horizontal (DS91). */
export type AdminColumn<Row> = {
  id: string;
  header: string;
  sortable?: boolean;
  align?: "start" | "end";
  sticky?: boolean;
  /** Classes ajoutées à l'en-tête ET aux cellules de la colonne (ex. masquer une colonne secondaire à l'étroit). */
  className?: string;
  cell: (row: Row) => ReactNode;
};

/** Ce que l'en-tête d'une colonne a besoin de savoir : tout sauf la cellule. */
export type AdminColumnHeader = Omit<AdminColumn<never>, "cell">;
