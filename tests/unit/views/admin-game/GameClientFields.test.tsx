// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AdminFormContext } from "@/components/admin/adminFormContext";
import { GAME_MESSAGES } from "@/models/adminGameMessages";
import type { FormState } from "@/models/FormState";
import type { GameSeasonOption } from "@/models/GameSeasonOption";
import { GameSeasonTeamsFields } from "@/views/admin-game/components/GameSeasonTeamsFields";
import { GameVideoField } from "@/views/admin-game/components/GameVideoField";
import { GameWarningAcknowledgement } from "@/views/admin-game/components/GameWarningAcknowledgement";

const SEASONS: GameSeasonOption[] = [
  { id: 4, label: "2025-2026 · D1 · U15G", rpbTeamId: 1, rpbTeamName: "FAC Basket" },
  { id: 1, label: "2024-2025 · D3 · U15G", rpbTeamId: 2, rpbTeamName: "TIGER'S" },
  { id: 9, label: "2023-2024 · Sans équipe", rpbTeamId: null, rpbTeamName: null },
];
const TEAMS = [
  { id: 1, name: "FAC Basket" },
  { id: 2, name: "TIGER'S" },
  { id: 3, name: "OTB" },
];
const optionNames = (select: HTMLElement) => within(select).getAllByRole("option").map((option) => option.textContent);

describe("GameSeasonTeamsFields", () => {
  const initial = { seasonId: "4", side: "", opponentId: "" };

  it("l'indice RPB et la liste d'adversaires suivent la saison choisie", async () => {
    render(<GameSeasonTeamsFields seasons={SEASONS} teams={TEAMS} initial={initial} mode="rpb" />);
    expect(screen.getByText("Équipe RPB de cette saison : FAC Basket")).toBeTruthy();
    expect(optionNames(screen.getByLabelText(/Équipe adverse/))).toEqual(["Choisis l'équipe adverse…", "OTB", "TIGER'S"]);

    await userEvent.selectOptions(screen.getByLabelText(/Saison/), "1");
    expect(screen.getByText("Équipe RPB de cette saison : TIGER'S")).toBeTruthy();
    expect(optionNames(screen.getByLabelText(/Équipe adverse/))).toEqual(["Choisis l'équipe adverse…", "FAC Basket", "OTB"]);
  });

  it("saison sans équipe RPB : message explicite", async () => {
    render(<GameSeasonTeamsFields seasons={SEASONS} teams={TEAMS} initial={{ ...initial, seasonId: "9" }} mode="rpb" />);
    expect(screen.getByText(GAME_MESSAGES.noRpbTeamHint)).toBeTruthy();
  });

  it("zone d'indice annoncée poliment, labels liés", () => {
    render(<GameSeasonTeamsFields seasons={SEASONS} teams={TEAMS} initial={initial} mode="rpb" />);
    expect(document.querySelector("[aria-live=polite]")).not.toBeNull();
    expect(screen.getByLabelText(/Côté de l'équipe RPB/)).toBeTruthy();
  });

  it("mode fixe : texte en lecture seule, aucun choix de côté ni d'adversaire", () => {
    render(
      <GameSeasonTeamsFields seasons={SEASONS} teams={TEAMS} initial={initial} mode="fixed" fixedTeams={{ home: "A", away: "B" }} />,
    );
    expect(screen.getByText("Domicile : A · Extérieur : B")).toBeTruthy();
    expect(screen.queryByLabelText(/Côté/)).toBeNull();
    expect(screen.queryByLabelText(/Équipe adverse/)).toBeNull();
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
  });
});

describe("GameVideoField", () => {
  const none = { kind: "none" } as const;

  it("retour en direct : reconnue (avec lien), invalide ; jamais d'iframe", async () => {
    const { container } = render(<GameVideoField initialValue="" current={none} />);
    const input = screen.getByLabelText("Vidéo YouTube");
    expect(screen.queryByRole("link")).toBeNull();

    await userEvent.type(input, "https://youtu.be/abcdefghijk");
    expect(screen.getByText("Vidéo reconnue (identifiant abcdefghijk).")).toBeTruthy();
    const link = screen.getByRole("link", { name: /Vérifier sur YouTube/ });
    expect(link.getAttribute("href")).toBe("https://www.youtube.com/watch?v=abcdefghijk");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");

    await userEvent.clear(input);
    await userEvent.type(input, "pas une vidéo");
    expect(screen.getByText(GAME_MESSAGES.videoInvalid)).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("[aria-live=polite]")).not.toBeNull();
  });

  it("vidéo existante vidée : retrait refusé annoncé ; texte invalide hérité : avertissement", async () => {
    const { unmount } = render(<GameVideoField initialValue="abcdefghijk" current={{ kind: "youtube", videoId: "abcdefghijk" }} />);
    await userEvent.clear(screen.getByLabelText("Vidéo YouTube"));
    expect(screen.getByText(GAME_MESSAGES.videoRemovalUnsupported)).toBeTruthy();
    unmount();
    render(<GameVideoField initialValue="vieux lien" current={{ kind: "invalid", raw: "vieux lien" }} />);
    expect(screen.getByText(GAME_MESSAGES.videoLegacyInvalid)).toBeTruthy();
  });
});

describe("GameWarningAcknowledgement", () => {
  const errorState = (fieldErrors: Record<string, string>, values: Record<string, string> = {}): FormState<string> => ({
    status: "error",
    message: GAME_MESSAGES.warningsIntro,
    fieldErrors,
    values,
  });
  const renderWith = (state: FormState<string>) =>
    render(
      <AdminFormContext.Provider value={{ state, pending: false }}>
        <form data-testid="form">
          <GameWarningAcknowledgement field="ackDuplicateRound" />
        </form>
      </AdminFormContext.Provider>,
    );

  it("avertissement : texte en alerte et case non cochée", () => {
    renderWith(errorState({ ackDuplicateRound: "La journée 3 existe déjà dans cette saison." }));
    expect(screen.getByRole("alert").textContent).toContain("La journée 3 existe déjà");
    const box = screen.getByRole("checkbox", { name: "Je confirme : c'est bien un second match pour cette journée" }) as HTMLInputElement;
    expect(box.checked).toBe(false);
    expect(box.name).toBe("ackDuplicateRound");
  });

  it("sans erreur : rien", () => {
    const { container } = renderWith({ status: "idle" });
    expect(container.querySelector("input")).toBeNull();
  });

  it("acquittement précédent conservé en champ caché", () => {
    const { container } = renderWith(errorState({}, { ackDuplicateRound: "on" }));
    const hidden = container.querySelector("input[type=hidden][name=ackDuplicateRound]") as HTMLInputElement;
    expect(hidden.value).toBe("on");
    expect(screen.queryByRole("checkbox")).toBeNull();
  });
});
