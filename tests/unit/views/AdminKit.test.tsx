// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminConfirmForm } from "@/components/admin/AdminConfirmForm";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminNavLink } from "@/components/admin/AdminNavLink";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { AdminRowAction } from "@/components/admin/AdminRowAction";
import { AdminSelectField } from "@/components/admin/AdminSelectField";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminTextField } from "@/components/admin/AdminTextField";
import { DeletionImpactList } from "@/components/admin/DeletionImpactList";
import type { SortState } from "@/models/AdminListQuery";
import { formError, IDLE_FORM_STATE, type ConfirmFormState, type FormState } from "@/models/FormState";

const pathname = vi.hoisted(() => ({ value: "/admin/team" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

type Field = "name" | "kind";
const FIELDS = { name: "", kind: "" };

describe("AdminNavLink", () => {
  it("aria-current sur la rubrique et ses sous-pages, pas sur une autre", () => {
    pathname.value = "/admin/team/12/edit";
    render(
      <>
        <AdminNavLink href="/admin/team" label="Équipes" />
        <AdminNavLink href="/admin/player" label="Joueurs" />
      </>,
    );
    expect(screen.getByRole("link", { name: "Équipes" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Joueurs" })).not.toHaveAttribute("aria-current");
  });
});

describe("AdminForm", () => {
  const options = [{ value: "a", label: "Option A" }];

  function renderForm(action: (previous: FormState<Field>, formData: FormData) => Promise<FormState<Field>>) {
    return render(
      <AdminForm<Field> action={action} submitLabel="Enregistrer" busyLabel="Enregistrement…" cancelHref="/admin/team">
        <AdminTextField name="name" label="Nom" required />
        <AdminSelectField name="kind" label="Type" options={options} placeholder="Choisir…" />
      </AdminForm>,
    );
  }

  it("légende, bouton, « Annuler » est un lien vers cancelHref", () => {
    renderForm(async () => IDLE_FORM_STATE);
    expect(screen.getByText(/champs marqués d'une étoile/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Annuler" })).toHaveAttribute("href", "/admin/team");
    expect(screen.getByLabelText(/Nom/)).toHaveAttribute("aria-required", "true");
  });

  it("erreur de champ reliée, alerte globale, saisie conservée, focus sur le champ invalide", async () => {
    const action = vi.fn(async () =>
      formError<Field>({ name: "Trop court", kind: "a" }, "Corrige les champs signalés.", { name: "Trop court" }),
    );
    renderForm(action);
    await userEvent.type(screen.getByLabelText(/Nom/), "x");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(screen.getByLabelText(/Nom/)).toHaveAttribute("aria-invalid", "true"));
    const name = screen.getByLabelText(/Nom/);
    expect(name).toHaveAccessibleDescription("Trop court");
    expect(name).toHaveValue("Trop court");
    expect(screen.getByLabelText("Type")).toHaveValue("a");
    expect(screen.getByRole("alert")).toHaveTextContent("Corrige les champs signalés.");
    await waitFor(() => expect(name).toHaveFocus());
  });

  it("sans erreur de champ, le focus va à l'alerte", async () => {
    renderForm(async () => formError<Field>(FIELDS, "Le serveur a refusé l'opération."));
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    const alert = await screen.findByRole("alert");
    await waitFor(() => expect(alert.parentElement).toHaveFocus());
  });

  it("deux soumissions rapides : une seule exécution de l'action, bouton occupé", async () => {
    let resolve: (state: FormState<Field>) => void = () => {};
    const action = vi.fn(() => new Promise<FormState<Field>>((done) => (resolve = done)));
    renderForm(action);
    const form = screen.getByRole("button", { name: "Enregistrer" }).closest("form") as HTMLFormElement;
    await act(async () => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });
    expect(action).toHaveBeenCalledTimes(1);
    const busy = screen.getByRole("button", { name: "Enregistrement…" });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("aria-busy", "true");
    expect(screen.getByLabelText(/Nom/)).toHaveAttribute("readonly");
    await act(async () => resolve(IDLE_FORM_STATE));
  });
});

describe("AdminConfirmForm", () => {
  it("n'appelle l'action qu'au clic, envoie les champs cachés, « Annuler » d'abord", async () => {
    const action = vi.fn(async (_previous: ConfirmFormState, data: FormData) => {
      void data;
      return IDLE_FORM_STATE as ConfirmFormState;
    });
    render(
      <AdminConfirmForm
        action={action}
        fields={{ id: "15" }}
        confirmLabel="Supprimer définitivement"
        busyLabel="Suppression…"
        cancelHref="/admin/team"
      />,
    );
    expect(action).not.toHaveBeenCalled();
    const controls = document.querySelectorAll("a, button");
    expect([...controls].map((control) => control.textContent)).toEqual(["Annuler", "Supprimer définitivement"]);
    await userEvent.click(screen.getByRole("button", { name: "Supprimer définitivement" }));
    expect(action).toHaveBeenCalledTimes(1);
    expect(action.mock.calls[0][1].get("id")).toBe("15");
  });

  it("affiche l'erreur de l'action", async () => {
    render(
      <AdminConfirmForm
        action={async () => formError({}, "La suppression a échoué")}
        fields={{ id: "1" }}
        confirmLabel="Supprimer"
        busyLabel="…"
        cancelHref="/x"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("La suppression a échoué");
  });

  it("tone neutral : pas d'icône de corbeille ni de fond danger", () => {
    render(
      <AdminConfirmForm
        action={async () => IDLE_FORM_STATE}
        fields={{}}
        confirmLabel="Réinitialiser"
        busyLabel="…"
        cancelHref="/x"
        tone="neutral"
      />,
    );
    expect(screen.getByRole("button", { name: "Réinitialiser" }).className).not.toContain("bg-danger");
  });
});

describe("AdminNotice", () => {
  beforeEach(() => {
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
  });

  it("annonce le message dans role=status, nettoie l'URL, se ferme", async () => {
    render(<AdminNotice message="Équipe créée." cleanHref="/admin/team" />);
    expect(await screen.findByRole("status")).toHaveTextContent("Équipe créée.");
    expect(window.history.replaceState).toHaveBeenCalledWith(null, "", "/admin/team");
    await userEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("message vide : rien", () => {
    render(<AdminNotice message="" cleanHref="/admin/team" />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});

describe("AdminTable et AdminRowAction", () => {
  type Row = { id: number; name: string };
  const rows: Row[] = [
    { id: 1, name: "Colomiers" },
    { id: 2, name: "Pibrac" },
  ];

  function renderTable(sort: SortState = { column: "name", direction: "asc" }) {
    render(
      <AdminTable<Row>
        caption="2 équipes · triées par nom"
        columns={[
          { id: "name", header: "Équipe", sortable: true, sticky: true, cell: (row) => row.name },
          { id: "id", header: "Numéro", cell: (row) => String(row.id) },
        ]}
        rows={rows}
        getRowKey={(row) => String(row.id)}
        sort={sort}
        buildSortHref={(column) => `/admin/team?tri=${column}`}
        rowActions={(row) => <AdminRowAction href={`/admin/team/${row.id}/edit`} label="Modifier" subject={row.name} />}
        isRowHighlighted={(row) => row.id === 2}
      />,
    );
  }

  it("légende, région focalisable, aria-sort, lien de tri et noms d'actions contextualisés", () => {
    renderTable();
    expect(screen.getByRole("table", { name: /2 équipes/ })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /2 équipes/ })).toHaveAttribute("tabindex", "0");
    const header = screen.getByRole("columnheader", { name: /Équipe/ });
    expect(header).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getByRole("link", { name: /Équipe.*décroissant/ })).toHaveAttribute("href", "/admin/team?tri=name");
    expect(screen.getByRole("columnheader", { name: "Numéro" })).not.toHaveAttribute("aria-sort");
    expect(screen.getByRole("link", { name: "Modifier Colomiers" })).toHaveAttribute("href", "/admin/team/1/edit");
    expect(screen.getByRole("columnheader", { name: "Actions" })).toBeInTheDocument();
  });

  it("colonne non triée : aria-sort none ; ligne mise en évidence", () => {
    renderTable({ column: "id", direction: "desc" });
    expect(screen.getByRole("columnheader", { name: /Équipe/ })).toHaveAttribute("aria-sort", "none");
    expect(screen.getByRole("cell", { name: "Pibrac" }).className).toContain("bg-rpb-gold-light");
    expect(screen.getByRole("cell", { name: "Colomiers" }).className).not.toContain("bg-rpb-gold-light");
  });

  it("l'action danger garde son texte visible dans son nom accessible", () => {
    render(<AdminRowAction href="/x" label="Supprimer" subject="Pibrac" tone="danger" />);
    expect(screen.getByRole("link", { name: "Supprimer Pibrac" }).className).toContain("border-danger");
  });
});

describe("DeletionImpactList", () => {
  it("ligne connue, ligne indéterminée, mention de minimum ; un 0 n'est jamais affiché", () => {
    render(
      <DeletionImpactList
        impact={{
          complete: false,
          lines: [
            { kind: "player", count: 12 },
            { kind: "account", count: 0 },
            { kind: "statLine", count: null },
          ],
        }}
      />,
    );
    expect(screen.getByText("12 joueurs")).toBeInTheDocument();
    expect(screen.getByText(/nombre indéterminé de lignes de statistiques/)).toBeInTheDocument();
    expect(screen.queryByText(/compte/)).not.toBeInTheDocument();
    expect(screen.getByText(/Le détail ci-dessus est un minimum/)).toBeInTheDocument();
  });

  it("impact vide", () => {
    render(<DeletionImpactList impact={{ complete: true, lines: [{ kind: "player", count: 0 }] }} />);
    expect(screen.getByText("Aucune autre donnée n'est liée à cet élément.")).toBeInTheDocument();
  });
});
