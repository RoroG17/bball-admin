// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GameLogEntry } from "@/models/GameLogEntry";
import type { RpbTeam } from "@/models/RpbTeam";
import { toCalendarGame } from "@/models/toCalendarGame";
import { GameLogTable } from "@/views/player-detail/components/GameLogTable";
import { makeGame } from "../models/factories";
import { makeGameLogEntry } from "../models/playerFactories";

// `useSearchParams` branché sur un faux store que `history.replaceState` met à jour (comme le routeur Next).
const store = vi.hoisted(() => ({ params: new URLSearchParams(), listeners: new Set<() => void>() }));

vi.mock("next/navigation", async () => {
  const React = await import("react");
  return {
    useSearchParams: () =>
      React.useSyncExternalStore(
        (listener) => {
          store.listeners.add(listener);
          return () => store.listeners.delete(listener);
        },
        () => store.params,
      ),
  };
});

const RPB: RpbTeam = { id: 1, name: "FAC Basket" };
const overview = (game: ReturnType<typeof makeGame>) => toCalendarGame(game, RPB, "2026-06-01");

const log: GameLogEntry[] = [
  makeGameLogEntry({
    gameId: 36,
    playingTimeSeconds: 1453,
    overview: overview(makeGame(53, 34, "FAC Basket", "Coq Carlanais", { id: 36, number: 1, date: "2025-11-08" })),
    periods: [
      { period: 1, twoPoints: { made: 2, missed: 1 }, assists: 1 },
      { period: 3, twoPoints: { made: 4, missed: 1 }, freeThrows: { made: 2, missed: 0 } },
    ],
  }),
  makeGameLogEntry({
    gameId: 38,
    playingTimeSeconds: null,
    lineCount: 2,
    overview: overview(makeGame(54, 57, "Pibracaise", "FAC Basket", { id: 38, number: 2, date: "2025-11-15" })),
    periods: [{ period: 2, threePoints: { made: 3, missed: 2 } }],
  }),
  makeGameLogEntry({ gameId: 999, overview: null, gameLabel: "Match sans fiche", periods: [] }),
];

const body = () => screen.getAllByRole("rowgroup")[1];

beforeEach(() => {
  store.params = new URLSearchParams();
  window.history.replaceState(null, "", "/player/LIC1000?saison=4");
  vi.spyOn(window.history, "replaceState").mockImplementation((_data, _unused, url) => {
    store.params = new URL(String(url), "http://localhost").searchParams;
    store.listeners.forEach((listener) => listener());
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  store.listeners.clear();
});

describe("GameLogTable", () => {
  it("nomme le tableau avec la sélection et la portée, et liste un match par ligne", () => {
    render(<GameLogTable log={log} periods={[1, 2, 3, 4]} selectionLabel="2025-2026 · D1 · U15G" />);
    expect(screen.getByRole("table")).toHaveAccessibleName("Statistiques match par match, 2025-2026 · D1 · U15G, match complet");
    expect(within(body()).getAllByRole("row")).toHaveLength(3);
  });

  it("lien de la date : nom complet avec l'adversaire, vers la fiche match", () => {
    render(<GameLogTable log={log} periods={[1, 2, 3, 4]} selectionLabel="S" />);
    const link = screen.getByRole("link", { name: "Match du 08/11/2025 contre Coq Carlanais" });
    expect(link).toHaveAttribute("href", "/game/36");
    expect(screen.getByRole("link", { name: "Match du 15/11/2025 contre Pibracaise" })).toBeInTheDocument();
  });

  it("score du RPB d'abord, lieu et résultat en texte", () => {
    render(<GameLogTable log={log} periods={[1, 2, 3, 4]} selectionLabel="S" />);
    const [home, away] = within(body()).getAllByRole("row");
    expect(home).toHaveTextContent("53 – 34");
    expect(home).toHaveTextContent("À domicile");
    expect(home).toHaveTextContent("Victoire");
    expect(away).toHaveTextContent("57 – 54");
    expect(away).toHaveTextContent("À l'extérieur");
    expect(away).toHaveTextContent("Doublon");
  });

  it("un match absent de la liste garde son libellé et un lien explicite", () => {
    render(<GameLogTable log={log} periods={[1, 2, 3, 4]} selectionLabel="S" />);
    const row = within(body()).getAllByRole("row")[2];
    expect(row).toHaveTextContent("Match sans fiche");
    expect(within(row).getByRole("link", { name: "Voir le match" })).toHaveAttribute("href", "/game/999");
  });

  it("minutes au format mm:ss, « — » si inconnues ; colonnes de stats et de tirs", () => {
    render(<GameLogTable log={log} periods={[1, 2, 3, 4]} selectionLabel="S" />);
    const [home, away] = within(body()).getAllByRole("row");
    expect(within(home).getByText("24:13")).toBeInTheDocument();
    expect(within(away).getAllByText("—").length).toBeGreaterThan(0);
    expect(within(home).getByText("6/8")).toBeInTheDocument();
    for (const name of ["Match", "Adversaire", "Résultat", /^Minutes jouées/, /^Points$/, /^Tirs à 2 points/, /^Lancers francs/]) {
      expect(screen.getByRole("columnheader", { name })).toBeInTheDocument();
    }
  });

  it("pied : moyenne par match en décimales et total en entiers", () => {
    render(<GameLogTable log={log} periods={[1, 2, 3, 4]} selectionLabel="S" />);
    const [average, total] = within(screen.getAllByRole("rowgroup")[2]).getAllByRole("row");
    expect(average).toHaveTextContent("Moyenne par match");
    expect(total).toHaveTextContent("Total");
    // 2×6 + 3×3 + 2 = 23 points sur 3 matchs.
    expect(total).toHaveTextContent("23");
    expect(average).toHaveTextContent("7,7");
    expect(total).toHaveTextContent("6/8");
  });

  it("filtre Q3 : colonne Minutes masquée, mention, URL mise à jour sans autre paramètre perdu", async () => {
    render(<GameLogTable log={log} periods={[1, 2, 3, 4]} selectionLabel="S" />);
    await userEvent.click(screen.getByRole("button", { name: "Quart-temps 3" }));
    expect(window.history.replaceState).toHaveBeenLastCalledWith(null, "", "/player/LIC1000?saison=4&periode=q3");
    expect(screen.getByRole("table")).toHaveAccessibleName("Statistiques match par match, S, quart-temps 3");
    expect(screen.queryByRole("columnheader", { name: /^Minutes jouées/ })).not.toBeInTheDocument();
    expect(screen.getByText("Minutes : total du match, visibles avec « Tout ».")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tout" }));
    expect(window.history.replaceState).toHaveBeenLastCalledWith(null, "", "/player/LIC1000?saison=4");
  });
});
