import { describe, expect, it } from "vitest";
import { buildPlayerHref } from "@/models/buildPlayerHref";
import { canViewPlayer } from "@/models/canViewPlayer";
import { dedupeByLicence } from "@/models/dedupeByLicence";
import { describePlayerSeasonSelection } from "@/models/describePlayerSeasonSelection";
import { filterPlayersByName } from "@/models/filterPlayersByName";
import { formatPlayerListScopeParam } from "@/models/formatPlayerListScopeParam";
import { formatPlayerSeasonParam } from "@/models/formatPlayerSeasonParam";
import { getPlayerVisibility } from "@/models/getPlayerVisibility";
import { listVisiblePlayerTabs } from "@/models/listVisiblePlayerTabs";
import { normalizeSearchText } from "@/models/normalizeSearchText";
import { parsePlayerLicence } from "@/models/parsePlayerLicence";
import { resolvePlayerListScope } from "@/models/resolvePlayerListScope";
import { resolvePlayerSeasons } from "@/models/resolvePlayerSeasons";
import { resolvePlayerSeasonSelection } from "@/models/resolvePlayerSeasonSelection";
import { resolvePlayerTab } from "@/models/resolvePlayerTab";
import { makeSeason } from "./factories";
import { makePlayerListEntry } from "./playerFactories";

const current = makeSeason({ id: 4, startYear: 2025, endYear: 2026, championship: "D1", category: "U15G" });
const previous = makeSeason({ id: 1, startYear: 2024, endYear: 2025, championship: "D3", category: "U15G" });
const older = makeSeason({ id: 2, startYear: 2023, endYear: 2024 });

describe("resolvePlayerListScope / formatPlayerListScopeParam", () => {
  it("donne « tous » à l'admin qui le demande", () => {
    const scope = resolvePlayerListScope([current], "tous", "admin");
    expect(scope).toEqual({ kind: "all" });
    expect(formatPlayerListScopeParam(scope!)).toBe("tous");
  });

  it("ramène un joueur qui demande « tous » sur sa saison par défaut", () => {
    expect(resolvePlayerListScope([previous, current], "tous", "player")).toEqual({ kind: "season", season: current });
  });

  it("garde une saison accessible, sinon la plus récente", () => {
    expect(resolvePlayerListScope([current, previous], "1", "player")).toEqual({ kind: "season", season: previous });
    expect(resolvePlayerListScope([current, previous], "99", "player")).toEqual({ kind: "season", season: current });
    expect(resolvePlayerListScope([current, previous], undefined, "admin")).toEqual({ kind: "season", season: current });
    expect(formatPlayerListScopeParam({ kind: "season", season: previous })).toBe("1");
  });

  it("renvoie null sans saison", () => {
    expect(resolvePlayerListScope([], undefined, "player")).toBeNull();
    expect(resolvePlayerListScope([], "4", "admin")).toBeNull();
  });
});

describe("dedupeByLicence", () => {
  it("garde la première occurrence, dans l'ordre", () => {
    const a = makePlayerListEntry("Lucas", "MARCHAND", "L1");
    const b = makePlayerListEntry("Paul", "DURAND", "L2");
    const aBis = { ...makePlayerListEntry("Lucas", "MARCHAND", "L1"), team: { id: 2, name: "Autre", logoUrl: null } };
    expect(dedupeByLicence([a, b, aBis])).toEqual([a, b]);
  });
});

describe("normalizeSearchText / filterPlayersByName", () => {
  const entries = [
    makePlayerListEntry("Paul", "DURAND"),
    makePlayerListEntry("Élodie", "ROUSSEL"),
    makePlayerListEntry("Lucas", "MARCHAND"),
  ];

  it("retire les accents, la casse et les espaces en trop", () => {
    expect(normalizeSearchText("  Élodie   DURAND ")).toBe("elodie durand");
  });

  it("cherche chaque mot, dans n'importe quel ordre", () => {
    expect(filterPlayersByName(entries, "dur pa").map((e) => e.player.firstName)).toEqual(["Paul"]);
    expect(filterPlayersByName(entries, "elodie").map((e) => e.player.firstName)).toEqual(["Élodie"]);
    expect(filterPlayersByName(entries, "MARCH")).toHaveLength(1);
  });

  it("renvoie tout pour une recherche vide, rien pour un mot absent", () => {
    expect(filterPlayersByName(entries, "   ")).toHaveLength(3);
    expect(filterPlayersByName(entries, "zzz")).toEqual([]);
  });
});

describe("parsePlayerLicence", () => {
  it("accepte 1 à 8 caractères alphanumériques", () => {
    expect(parsePlayerLicence("AB123456")).toBe("AB123456");
    expect(parsePlayerLicence("LIC1000")).toBe("LIC1000");
  });

  it.each(["", "create-examen", "a b", "AB1234567", "é", "%2F"])("refuse %j", (raw) => {
    expect(parsePlayerLicence(raw)).toBeNull();
  });
});

describe("getPlayerVisibility / canViewPlayer", () => {
  const admin = { role: "admin" as const, licence: null };
  const lucas = { role: "player" as const, licence: "LIC1000" };

  it("donne tout à l'admin", () => {
    expect(getPlayerVisibility(admin, "LIC2000")).toEqual({
      matchStats: true,
      personalInfo: true,
      exams: true,
      physical: true,
      adminActions: true,
    });
  });

  it("donne tout au joueur sur sa fiche, sauf les actions admin", () => {
    expect(getPlayerVisibility(lucas, "LIC1000")).toEqual({
      matchStats: true,
      personalInfo: true,
      exams: true,
      physical: true,
      adminActions: false,
    });
  });

  it("limite un coéquipier aux stats de match", () => {
    expect(getPlayerVisibility(lucas, "LIC2000")).toEqual({
      matchStats: true,
      personalInfo: false,
      exams: false,
      physical: false,
      adminActions: false,
    });
  });

  it("ouvre la fiche à l'admin, à soi-même, au coéquipier qui partage une saison", () => {
    expect(canViewPlayer({ viewer: admin, targetLicence: "LIC2000", sharedSeasonCount: 0 })).toBe(true);
    expect(canViewPlayer({ viewer: lucas, targetLicence: "LIC1000", sharedSeasonCount: 0 })).toBe(true);
    expect(canViewPlayer({ viewer: lucas, targetLicence: "LIC2000", sharedSeasonCount: 1 })).toBe(true);
    expect(canViewPlayer({ viewer: lucas, targetLicence: "LIC3000", sharedSeasonCount: 0 })).toBe(false);
  });
});

describe("resolvePlayerSeasons", () => {
  const allSeasons = [previous, current, older];

  it("réunit participations et saisons des stats, sans doublon, de la plus récente à la plus ancienne", () => {
    const seasons = resolvePlayerSeasons({
      allSeasons,
      participationSeasonIds: [4, 4],
      statSeasonIds: [1, 4, 99],
      viewerSeasonIds: "all",
    });
    expect(seasons.map((season) => season.id)).toEqual([4, 1]);
  });

  it("limite aux saisons du lecteur", () => {
    const seasons = resolvePlayerSeasons({
      allSeasons,
      participationSeasonIds: [4, 1, 2],
      statSeasonIds: [],
      viewerSeasonIds: [4],
    });
    expect(seasons.map((season) => season.id)).toEqual([4]);
  });

  it("renvoie une liste vide sans saison", () => {
    expect(
      resolvePlayerSeasons({ allSeasons, participationSeasonIds: [], statSeasonIds: [], viewerSeasonIds: "all" }),
    ).toEqual([]);
  });
});

describe("sélection de saison de la fiche", () => {
  it("reconnaît la carrière, une saison valide, sinon la plus récente", () => {
    expect(resolvePlayerSeasonSelection([current, previous], "carriere")).toEqual({ kind: "career" });
    expect(resolvePlayerSeasonSelection([current, previous], "1")).toEqual({ kind: "season", season: previous });
    expect(resolvePlayerSeasonSelection([current, previous], "2")).toEqual({ kind: "season", season: current });
  });

  it("retombe sur la carrière sans saison (jamais seasons[0] non gardé, P4)", () => {
    expect(resolvePlayerSeasonSelection([], undefined)).toEqual({ kind: "career" });
  });

  it("formate le paramètre et le libellé complet", () => {
    expect(formatPlayerSeasonParam({ kind: "career" })).toBe("carriere");
    expect(formatPlayerSeasonParam({ kind: "season", season: current })).toBe("4");
    expect(describePlayerSeasonSelection({ kind: "season", season: current })).toBe("2025-2026 · D1 · U15G");
    expect(describePlayerSeasonSelection({ kind: "career" })).toBe("Carrière (toutes les saisons)");
  });
});

describe("onglets et URL de la fiche", () => {
  it("liste les onglets autorisés, dans l'ordre", () => {
    expect(listVisiblePlayerTabs(getPlayerVisibility({ role: "admin", licence: null }, "X"))).toEqual([
      "statistics",
      "exams",
      "physical",
    ]);
    expect(listVisiblePlayerTabs(getPlayerVisibility({ role: "player", licence: "A" }, "B"))).toEqual(["statistics"]);
  });

  it("retombe sur Statistiques pour un onglet absent, inconnu ou non autorisé", () => {
    expect(resolvePlayerTab("examens", ["statistics", "exams"])).toBe("exams");
    expect(resolvePlayerTab("physique", ["statistics"])).toBe("statistics");
    expect(resolvePlayerTab("exams", ["statistics", "exams"])).toBe("statistics");
    expect(resolvePlayerTab(undefined, ["statistics", "exams"])).toBe("statistics");
  });

  it("construit une URL canonique", () => {
    expect(buildPlayerHref("LIC1000")).toBe("/player/LIC1000");
    expect(buildPlayerHref("LIC1000", { saison: "4", onglet: "statistics" })).toBe("/player/LIC1000?saison=4");
    expect(buildPlayerHref("LIC1000", { onglet: "exams", saison: "carriere", periode: "q3" })).toBe(
      "/player/LIC1000?saison=carriere&onglet=examens&periode=q3",
    );
    expect(buildPlayerHref("A B", { saison: "", periode: null })).toBe("/player/A%20B");
  });
});
