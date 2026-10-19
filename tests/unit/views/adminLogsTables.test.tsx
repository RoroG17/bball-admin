// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ErrorLogEntry } from "@/models/ErrorLogEntry";
import type { LogListQuery } from "@/models/LogListQuery";
import type { RequestLogEntry } from "@/models/RequestLogEntry";
import { LogErrorTable } from "@/views/admin-logs/components/LogErrorTable";
import { LogRequestTable } from "@/views/admin-logs/components/LogRequestTable";

const QUERY: LogListQuery = { kind: "errors", filters: { os: "ios" }, page: 2, detailId: null };

const error = (overrides: Partial<ErrorLogEntry> = {}): ErrorLogEntry => ({
  id: 1840,
  occurredAt: "2026-10-12T12:02:11.000000Z",
  source: "server",
  statusCode: 500,
  message: "Server Error",
  route: "/api/matchs/52",
  method: "GET",
  user: { id: 4, username: "theo.bernard" },
  platform: "mobile",
  os: "Android 14",
  context: null,
  position: { latitude: 43.60452, longitude: 1.44338 },
  ...overrides,
});

const request = (overrides: Partial<RequestLogEntry> = {}): RequestLogEntry => ({
  id: 5200,
  occurredAt: "2026-10-12T12:02:11.000000Z",
  method: "GET",
  route: "/api/matchs",
  statusCode: 200,
  durationMs: 1234,
  user: null,
  platform: null,
  os: null,
  ipAddress: "203.0.113.17",
  position: { latitude: 48.8566, longitude: 2.3522 },
  ...overrides,
});

describe("LogErrorTable", () => {
  it("légende, en-têtes, aucune colonne triable, ni méthode ni IP ni position en liste", () => {
    render(<LogErrorTable items={[error()]} query={QUERY} />);
    expect(screen.getByText("Erreurs, de la plus récente à la plus ancienne")).toBeInTheDocument();
    const headers = screen.getAllByRole("columnheader", { hidden: true }).map((header) => header.textContent);
    expect(headers).toEqual(["Date", "Source", "Statut", "Message", "Route", "Utilisateur", "Plateforme", "Actions"]);
    expect(screen.queryByRole("link", { name: /trier/ })).toBeNull();
    const table = screen.getByRole("table");
    expect(table).not.toHaveTextContent("GET");
    expect(table).not.toHaveTextContent("43,60452");
    expect(table).toHaveTextContent("Mobile · Android 14");
  });

  it("nom accessible distinct par ligne, lien vers ?detail=<id>#detail", () => {
    render(<LogErrorTable items={[error(), error({ id: 1841, occurredAt: "2026-10-12T12:03:00Z" })]} query={QUERY} />);
    const link = screen.getByRole("link", { name: "Détail l'erreur du 12/10/2026 14:02:11" });
    expect(link).toHaveAttribute("href", "/admin/logs?os=ios&page=2&detail=1840#detail");
    expect(screen.getByRole("link", { name: "Détail l'erreur du 12/10/2026 14:03:00" })).toBeInTheDocument();
  });

  it("anonyme en italique, source client sans statut", () => {
    render(<LogErrorTable items={[error({ user: null, route: null, source: "client", statusCode: null })]} query={QUERY} />);
    expect(screen.getByText("Anonyme")).toHaveClass("italic");
    expect(screen.getByText("Sans statut HTTP")).toBeInTheDocument();
    expect(screen.getByText("Client")).toBeInTheDocument();
  });

  it("colonnes secondaires (utilisateur, plateforme) masquées sous 1120 px de tableau", () => {
    render(<LogErrorTable items={[error()]} query={QUERY} />);
    expect(screen.getByRole("columnheader", { name: "Utilisateur", hidden: true })).toHaveClass("hidden");
    expect(screen.getByRole("columnheader", { name: "Plateforme", hidden: true })).toHaveClass("hidden");
    expect(screen.getByRole("columnheader", { name: "Message" })).not.toHaveClass("hidden");
  });

  it("ligne dont le détail est ouvert : lien « Ouvert », aria-current, nom accessible précisé", () => {
    render(<LogErrorTable items={[error()]} query={{ ...QUERY, detailId: 1840 }} />);
    const link = screen.getByRole("link", { name: "Détail de l'erreur du 12/10/2026 14:02:11 (ouvert)" });
    expect(link).toHaveAttribute("aria-current", "true");
    expect(link).toHaveTextContent("Ouvert");
  });

  it("message long tronqué à 120 caractères avec « … », texte hostile en nœud texte", () => {
    const { container } = render(
      <LogErrorTable items={[error({ message: `<script>x</script>${"y".repeat(200)}` })]} query={QUERY} />,
    );
    expect(container.querySelector("script")).toBeNull();
    const cell = within(screen.getByRole("table")).getByText(/^<script>x<\/script>y+…$/);
    expect(Array.from(cell.textContent ?? "")).toHaveLength(121);
  });
});

describe("LogRequestTable", () => {
  it("colonnes des requêtes ; durée formatée ; ni IP ni position en liste", () => {
    render(<LogRequestTable items={[request()]} query={{ ...QUERY, kind: "requests" }} />);
    const headers = screen.getAllByRole("columnheader", { hidden: true }).map((header) => header.textContent);
    expect(headers).toEqual(["Date", "Méthode", "Route", "Statut", "Durée", "Utilisateur", "Plateforme", "Actions"]);
    const table = screen.getByRole("table");
    expect(table).toHaveTextContent(/1\s234\sms/);
    expect(table).not.toHaveTextContent("203.0.113.17");
    expect(table).not.toHaveTextContent("48,85660");
    expect(screen.getByText("Requêtes, de la plus récente à la plus ancienne")).toBeInTheDocument();
  });

  it("lien de détail avec le type dans l'URL", () => {
    render(<LogRequestTable items={[request()]} query={{ kind: "requests", filters: {}, page: 1, detailId: null }} />);
    expect(screen.getByRole("link", { name: "Détail la requête du 12/10/2026 14:02:11" })).toHaveAttribute(
      "href",
      "/admin/logs?type=requetes&detail=5200#detail",
    );
  });
});
