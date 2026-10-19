// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { LogListQuery } from "@/models/LogListQuery";
import { getActiveLogFilters } from "@/models/getActiveLogFilters";
import { LOG_BACK_SUPPORT_ALL } from "@/models/resolveLogBackSupport";
import { LogFilterBar } from "@/views/admin-logs/components/LogFilterBar";
import { LogKindTabs } from "@/views/admin-logs/components/LogKindTabs";

const QUERY: LogListQuery = { kind: "errors", filters: {}, page: 3, detailId: 12 };

describe("LogKindTabs", () => {
  it("rien n'est rendu avec un seul type (état actuel du back)", () => {
    const { container } = render(<LogKindTabs kinds={["errors"]} current="errors" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("deux types : aria-current sur l'actif, changer de type réinitialise filtres, page et détail", () => {
    render(<LogKindTabs kinds={["errors", "requests"]} current="requests" />);
    expect(screen.getByRole("navigation", { name: "Type de journal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Requêtes" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Requêtes" })).toHaveAttribute("href", "/admin/logs?type=requetes");
    expect(screen.getByRole("link", { name: "Erreurs" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Erreurs" })).toHaveAttribute("href", "/admin/logs");
  });
});

describe("LogFilterBar", () => {
  it("back actuel : seuls plateforme, système et source ; ni page ni detail dans le formulaire", () => {
    const { container } = render(
      <LogFilterBar query={QUERY} activeFilters={getActiveLogFilters("errors")} maxDate="2026-10-12" />,
    );
    expect(screen.getByRole("search", { name: "Filtrer les erreurs" })).toHaveAttribute("action", "/admin/logs");
    expect(screen.getByLabelText("Plateforme")).toBeInTheDocument();
    expect(screen.getByLabelText("Système (contient)")).toBeInTheDocument();
    expect(screen.getByLabelText("Source")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nom d'utilisateur")).toBeNull();
    expect(screen.queryByLabelText("Du")).toBeNull();
    expect(screen.queryByLabelText("Statut")).toBeNull();
    expect(container.querySelector('[name="page"]')).toBeNull();
    expect(container.querySelector('[name="detail"]')).toBeNull();
    expect(container.querySelector('[name="type"]')).toBeNull();
    expect(screen.getByRole("button", { name: "Filtrer" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Réinitialiser" })).toBeNull();
  });

  it("valeurs actives reprises dans les champs ; « Réinitialiser » vers la liste sans filtre", () => {
    render(
      <LogFilterBar
        query={{ ...QUERY, filters: { os: "ios", plateforme: "web", source: "client" } }}
        activeFilters={getActiveLogFilters("errors")}
        maxDate="2026-10-12"
      />,
    );
    expect(screen.getByLabelText("Système (contient)")).toHaveValue("ios");
    expect(screen.getByLabelText("Plateforme")).toHaveValue("web");
    expect(screen.getByLabelText("Source")).toHaveValue("client");
    expect(screen.getByRole("link", { name: "Réinitialiser" })).toHaveAttribute("href", "/admin/logs");
  });

  it("back livré : tous les filtres, dates natives bornées à aujourd'hui, statut des requêtes complet", () => {
    const { container } = render(
      <LogFilterBar
        query={{ kind: "requests", filters: {}, page: 1, detailId: null }}
        activeFilters={getActiveLogFilters("requests", LOG_BACK_SUPPORT_ALL)}
        maxDate="2026-10-12"
      />,
    );
    expect(screen.getByLabelText("Nom d'utilisateur")).toBeInTheDocument();
    expect(screen.getByLabelText("Route (contient)")).toBeInTheDocument();
    expect(screen.getByLabelText("Du")).toHaveAttribute("type", "date");
    expect(screen.getByLabelText("Du")).toHaveAttribute("max", "2026-10-12");
    expect(screen.getByLabelText("Au")).toHaveAttribute("max", "2026-10-12");
    expect(screen.queryByLabelText("Source")).toBeNull();
    const options = Array.from(screen.getByLabelText("Statut").querySelectorAll("option")).map((option) => option.textContent);
    expect(options).toEqual(["Tous", "Succès (2xx)", "Redirections (3xx)", "Erreurs client (4xx)", "Erreurs serveur (5xx)"]);
    expect(container.querySelector('input[name="type"]')).toHaveValue("requetes");
  });

  it("aucun filtre actif : rien n'est rendu", () => {
    const { container } = render(<LogFilterBar query={QUERY} activeFilters={[]} maxDate="2026-10-12" />);
    expect(container).toBeEmptyDOMElement();
  });
});
