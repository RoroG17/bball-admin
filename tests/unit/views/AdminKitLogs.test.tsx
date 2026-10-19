// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AdminColumn } from "@/components/admin/AdminColumn";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminRowAction } from "@/components/admin/AdminRowAction";
import { AdminTable } from "@/components/admin/AdminTable";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

type Row = { id: string; a: string };
const COLUMNS: AdminColumn<Row>[] = [
  { id: "a", header: "A", cell: (row) => row.a },
  { id: "b", header: "B", className: "hidden @min-[1120px]/tbl:table-cell", cell: (row) => row.a },
];
const base = {
  caption: "Légende",
  columns: COLUMNS,
  rows: [{ id: "1", a: "x" }],
  getRowKey: (row: Row) => row.id,
  sort: { column: "a", direction: "desc" as const },
  buildSortHref: () => "",
};

describe("AdminTable : extensions des journaux", () => {
  it("className de colonne appliquée à l'en-tête et aux cellules", () => {
    render(<AdminTable {...base} />);
    expect(screen.getByRole("columnheader", { name: "B", hidden: true })).toHaveClass("hidden");
    expect(screen.getAllByRole("cell", { hidden: true })[1]).toHaveClass("hidden");
    expect(screen.getAllByRole("cell")[0]).not.toHaveClass("hidden");
  });

  it("compact : marges de 12 px et alignement en haut ; par défaut inchangé", () => {
    const { rerender } = render(<AdminTable {...base} />);
    expect(screen.getAllByRole("cell")[0]).toHaveClass("px-4", "py-3", "align-middle");
    expect(screen.getByRole("columnheader", { name: "A" })).toHaveClass("px-4");
    rerender(<AdminTable {...base} compact />);
    expect(screen.getAllByRole("cell")[0]).toHaveClass("px-3", "py-2.5", "align-top");
    expect(screen.getByRole("columnheader", { name: "A" })).toHaveClass("px-3");
  });

  it("une colonne non triable qui est la colonne de tri courante reste un en-tête simple, sans lien", () => {
    render(<AdminTable {...base} />);
    expect(screen.getByRole("columnheader", { name: "A" })).not.toHaveAttribute("aria-sort");
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("AdminRowAction : extensions des journaux", () => {
  it("par défaut : nom « libellé sujet », pas d'aria-current", () => {
    render(<AdminRowAction href="/x" label="Détail" subject="l'erreur" />);
    const link = screen.getByRole("link", { name: "Détail l'erreur" });
    expect(link).not.toHaveAttribute("aria-current");
    expect(link).toHaveClass("bg-rpb-cream");
  });

  it("current : aria-current, fond bordeaux, nom accessible personnalisé", () => {
    render(
      <AdminRowAction href="/x" label="Ouvert" subject="l'erreur" current accessibleName="Détail de l'erreur (ouvert)" />,
    );
    const link = screen.getByRole("link", { name: "Détail de l'erreur (ouvert)" });
    expect(link).toHaveAttribute("aria-current", "true");
    expect(link).toHaveClass("bg-rpb-bordeaux");
  });
});

describe("liens sans préchargement", () => {
  it("PrimaryButton et AdminEmptyState acceptent prefetch={false} sans changer le rendu", () => {
    render(
      <>
        <PrimaryButton href="/a" prefetch={false}>
          Lien A
        </PrimaryButton>
        <AdminEmptyState kind="noMatch" title="Vide" action={{ href: "/b", label: "Lien B", prefetch: false }} />
      </>,
    );
    expect(screen.getByRole("link", { name: "Lien A" })).toHaveAttribute("href", "/a");
    expect(screen.getByRole("link", { name: "Lien B" })).toHaveAttribute("href", "/b");
  });
});
