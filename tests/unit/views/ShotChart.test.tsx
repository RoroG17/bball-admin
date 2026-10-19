// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ShotChart } from "@/views/game-detail/components/ShotChart";
import { makeShot } from "../models/gameDetailFactories";

const shots = [
  makeShot({ id: "1:a", playerLicence: "L1", period: 1, made: true }),
  makeShot({ id: "1:b", playerLicence: "L1", period: 3, made: false }),
  makeShot({ id: "2:c", playerLicence: "L2", period: 3, made: true }),
  makeShot({ id: "9:x", playerLicence: "XXX", period: 2, made: false }),
];
const options = [
  { licence: "L2", label: "Hugo BERNARD" },
  { licence: "L1", label: "Lucas MARTIN" },
];
const attempts = [
  { playerLicence: "L1", period: 1, attempted: 2 },
  { playerLicence: "L1", period: 3, attempted: 1 },
  { playerLicence: "L2", period: 3, attempted: 1 },
  { playerLicence: "XXX", period: 2, attempted: 1 },
];

const renderChart = (initialFilter = { side: "team" as "team" | "opponent", playerLicence: null as string | null, period: null as number | null }) =>
  render(
    <ShotChart
      shots={shots}
      options={options}
      periods={[1, 2, 3, 4]}
      attempts={attempts}
      initialFilter={initialFilter}
      court={<g />}
    />,
  );

const markers = (container: HTMLElement) => container.querySelectorAll("svg[role=img] > g").length;

describe("ShotChart", () => {
  it("affiche tous les tirs, le compteur, la légende et la complétude", () => {
    const { container } = renderChart();
    expect(screen.getByLabelText("Joueur")).toBeInTheDocument();
    expect(screen.getByLabelText("Quart-temps")).toBeInTheDocument();
    expect(screen.getByText("2/3")).toBeInTheDocument();
    expect(markers(container)).toBe(4); // 3 tirs + le terrain
    expect(screen.getByText("Réussi")).toBeInTheDocument();
    expect(screen.getByText("Manqué")).toBeInTheDocument();
    expect(screen.getByText("3 tirs placés sur 4 tentés")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAccessibleName(
      "Tous les joueurs, tous les quart-temps : 2 tirs réussis sur 3 placés sur le terrain. 3 tirs placés sur 4 tentés.",
    );
  });

  it("filtre par joueur puis par quart-temps", async () => {
    const { container } = renderChart();
    await userEvent.selectOptions(screen.getByLabelText("Joueur"), "L1");
    expect(screen.getByText("1/2")).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Quart-temps"), "3");
    expect(screen.getByText("0/1")).toBeInTheDocument();
    expect(markers(container)).toBe(2);
  });

  it("part du filtre initial et signale une sélection vide", async () => {
    renderChart({ side: "team", playerLicence: "L2", period: null });
    expect(screen.getByLabelText("Joueur")).toHaveValue("L2");
    await userEvent.selectOptions(screen.getByLabelText("Quart-temps"), "2");
    expect(screen.getByText("Aucun tir pour cette sélection.")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAccessibleName("Hugo BERNARD, quart-temps 2 : aucun tir placé.");
  });

  it("bascule sur les tirs de l'équipe adverse sans les mélanger", async () => {
    const { container } = renderChart();
    expect(markers(container)).toBe(4); // mon équipe uniquement : 3 tirs + le terrain
    await userEvent.selectOptions(screen.getByLabelText("Équipe"), "opponent");
    expect(markers(container)).toBe(2); // 1 tir adverse + le terrain
    expect(screen.getByLabelText("Joueur")).toBeDisabled();
    expect(screen.getByRole("img")).toHaveAccessibleName(
      "Équipe adverse, tous les quart-temps : 0 tir réussi sur 1 placé sur le terrain.",
    );
  });
});
