// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HALL_OF_FAME_MODES, type HallOfFameMode } from "@/models/HallOfFameMode";
import { HallOfFameModeTabs } from "@/views/hall-of-fame/components/HallOfFameModeTabs";

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

const panels = Object.fromEntries(HALL_OF_FAME_MODES.map((mode) => [mode, <p key={mode}>Contenu {mode}</p>])) as Record<
  HallOfFameMode,
  React.ReactNode
>;

function setUrl(search: string) {
  window.history.pushState(null, "", `/hall-of-fame${search}`);
  store.params = new URLSearchParams(search);
}

const tab = (name: string) => screen.getByRole("tab", { name });

describe("HallOfFameModeTabs", () => {
  beforeEach(() => {
    setUrl("");
    // `pushState` ci-dessus utilise le vrai historique ; seul `replaceState` est branché sur le faux routeur.
    vi.spyOn(window.history, "replaceState").mockImplementation((_data, _unused, url) => {
      const next = new URL(String(url), "http://localhost");
      store.params = next.searchParams;
      window.history.pushState(null, "", `${next.pathname}${next.search}`);
      store.listeners.forEach((listener) => listener());
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("expose 5 onglets aux libellés exacts, « Match » actif et son seul panneau visible", () => {
    render(<HallOfFameModeTabs panels={panels} />);
    expect(screen.getByRole("tablist", { name: "Mode de classement" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab").map((element) => element.textContent)).toEqual([
      "Match",
      "Moyenne par match",
      "Saison",
      "Moyenne par saison",
      "Carrière",
    ]);
    expect(tab("Match")).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    expect(screen.getByText("Contenu bestGame")).toBeVisible();
    // Les panneaux masqués restent dans le DOM : la bascule n'a besoin d'aucune requête.
    expect(screen.getAllByRole("tabpanel", { hidden: true })).toHaveLength(5);
    expect(screen.getByText("Contenu career")).not.toBeVisible();
  });

  it("lit le mode dans l'URL", () => {
    setUrl("?mode=carriere");
    render(<HallOfFameModeTabs panels={panels} />);
    expect(tab("Carrière")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Contenu career")).toBeVisible();
  });

  it("relie chaque onglet à son panneau", () => {
    render(<HallOfFameModeTabs panels={panels} />);
    const panel = screen.getByRole("tabpanel");
    expect(tab("Match")).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", tab("Match").id);
  });

  it("change de mode sans entrée d'historique, et revient à l'URL canonique pour le mode par défaut", async () => {
    render(<HallOfFameModeTabs panels={panels} />);
    await userEvent.click(tab("Saison"));
    expect(window.history.replaceState).toHaveBeenLastCalledWith(null, "", "/hall-of-fame?mode=saison");
    expect(tab("Saison")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Contenu bestSeason")).toBeVisible();
    await userEvent.click(tab("Match"));
    expect(window.history.replaceState).toHaveBeenLastCalledWith(null, "", "/hall-of-fame");
  });

  it("conserve les autres paramètres de l'URL", async () => {
    setUrl("?x=1&mode=carriere");
    render(<HallOfFameModeTabs panels={panels} />);
    await userEvent.click(tab("Saison"));
    expect(window.history.replaceState).toHaveBeenLastCalledWith(null, "", "/hall-of-fame?mode=saison&x=1");
  });

  it("n'a qu'un onglet dans l'ordre de tabulation (tabindex itinérant)", () => {
    render(<HallOfFameModeTabs panels={panels} />);
    const tabbable = screen.getAllByRole("tab").filter((element) => element.getAttribute("tabindex") === "0");
    expect(tabbable).toEqual([tab("Match")]);
  });

  it("se navigue au clavier : flèches circulaires, Fin, Début, avec le focus qui suit", async () => {
    render(<HallOfFameModeTabs panels={panels} />);
    tab("Match").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(tab("Moyenne par match")).toHaveAttribute("aria-selected", "true");
    expect(tab("Moyenne par match")).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(tab("Carrière")).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(tab("Match")).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(tab("Carrière")).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Home}");
    expect(tab("Match")).toHaveFocus();
    expect(window.history.replaceState).toHaveBeenLastCalledWith(null, "", "/hall-of-fame");
  });
});
