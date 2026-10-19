// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerStatsTable } from "@/views/game-detail/components/PlayerStatsTable";
import { makePlayerGameStats } from "../models/gameDetailFactories";

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

const lines = [
  makePlayerGameStats({
    lineId: 1,
    licence: "LIC1000",
    lastName: "MARTIN",
    firstName: "Lucas",
    playingTimeSeconds: 1453,
    periods: [{ period: 1, twoPoints: { made: 1 } }, { period: 3, twoPoints: { made: 4, missed: 1 } }],
  }),
  makePlayerGameStats({
    lineId: 2,
    licence: "LIC1001",
    lastName: "BERNARD",
    firstName: "Hugo",
    playingTimeSeconds: null,
    periods: [{ period: 2, threePoints: { made: 3 } }],
  }),
  makePlayerGameStats({ lineId: 3, licence: "LIC1001", lastName: "BERNARD", firstName: "Hugo" }),
];

const renderTable = (currentLicence: string | null = null) =>
  render(
    <PlayerStatsTable lines={lines} periods={[1, 2, 3, 4]} duplicateLicences={["LIC1001"]} currentLicence={currentLicence} />,
  );

const bodyRows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1, -1);
const rowNames = () => bodyRows().map((row) => within(row).getByRole("link").textContent);

describe("PlayerStatsTable", () => {
  beforeEach(() => {
    store.params = new URLSearchParams();
    vi.spyOn(window.history, "replaceState").mockImplementation((_data, _unused, url) => {
      store.params = new URL(String(url), "http://localhost").searchParams;
      store.listeners.forEach((listener) => listener());
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("« Tout » est pressé par défaut, avec la colonne Minutes et la ligne Total", () => {
    renderTable();
    expect(screen.getByRole("button", { name: "Tout" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("table", { name: "Statistiques par joueur, match complet" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Minutes jouées/ })).toBeInTheDocument();
    expect(screen.getByText("24:13")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    const total = screen.getByRole("rowheader", { name: "Total équipe" }).closest("tr")!;
    expect(within(total).getByText("19")).toBeInTheDocument();
  });

  it("lit la période dans l'URL", () => {
    store.params = new URLSearchParams("periode=q3");
    renderTable();
    expect(screen.getByRole("button", { name: "Quart-temps 3" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("columnheader", { name: /Minutes jouées/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Minutes : total du match/)).toBeInTheDocument();
  });

  it("change de période sans entrée d'historique et recalcule", async () => {
    renderTable();
    await userEvent.click(screen.getByRole("button", { name: "Quart-temps 2" }));
    expect(window.history.replaceState).toHaveBeenLastCalledWith(null, "", "/?periode=q2");
    expect(screen.getByRole("table", { name: "Statistiques par joueur, quart-temps 2" })).toBeInTheDocument();
    const total = screen.getByRole("rowheader", { name: "Total équipe" }).closest("tr")!;
    expect(within(total).getByText("9")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tout" }));
    expect(window.history.replaceState).toHaveBeenLastCalledWith(null, "", "/");
  });

  it("trie au clic sur un en-tête, accessible par aria-sort", async () => {
    renderTable();
    expect(rowNames()).toEqual(["Hugo BERNARD", "Hugo BERNARD", "Lucas MARTIN"]);
    const points = screen.getByRole("button", { name: "Points" });
    await userEvent.click(points);
    expect(points.closest("th")).toHaveAttribute("aria-sort", "descending");
    expect(rowNames()[0]).toBe("Lucas MARTIN");
    await userEvent.click(points);
    expect(points.closest("th")).toHaveAttribute("aria-sort", "ascending");
  });

  it("marque les doublons, ma ligne, et lie les noms à la fiche joueur", () => {
    renderTable("LIC1000");
    expect(screen.getAllByText("Doublon")).toHaveLength(2);
    expect(screen.getByText("(toi)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lucas MARTIN" })).toHaveAttribute("href", "/player/LIC1000");
  });
});
