import { describe, expect, it } from "vitest";
import { IMPACT_KINDS, IMPACT_LABELS, type DeletionImpact } from "@/models/DeletionImpact";
import { describeImpactLine } from "@/models/describeImpactLine";
import { summarizeDeletionImpact } from "@/models/summarizeDeletionImpact";

describe("IMPACT_LABELS", () => {
  it("couvre tous les types avec singulier et pluriel", () => {
    for (const kind of IMPACT_KINDS) {
      expect(IMPACT_LABELS[kind].one).toBeTruthy();
      expect(IMPACT_LABELS[kind].other).toBeTruthy();
    }
    expect(IMPACT_LABELS.game).toEqual({ one: "match", other: "matchs" });
  });
});

describe("describeImpactLine", () => {
  it("singulier pour 1, pluriel au-delà", () => {
    expect(describeImpactLine({ kind: "game", count: 1 })).toBe("1 match");
    expect(describeImpactLine({ kind: "game", count: 12 })).toBe("12 matchs");
  });

  it("formate le millier en fr-FR", () => {
    expect(describeImpactLine({ kind: "statLine", count: 1234 })).toMatch(/^1\s234 lignes de statistiques de match/);
  });

  it("null → nombre indéterminé", () => {
    expect(describeImpactLine({ kind: "game", count: null })).toBe("un nombre indéterminé de matchs");
    expect(describeImpactLine({ kind: "account", count: null })).toBe("un nombre indéterminé de comptes utilisateurs");
  });
});

describe("summarizeDeletionImpact", () => {
  it("écarte les lignes à 0 et garde l'ordre de IMPACT_KINDS", () => {
    const impact: DeletionImpact = {
      complete: true,
      lines: [
        { kind: "measurement", count: 2 },
        { kind: "game", count: 0 },
        { kind: "player", count: 1 },
      ],
    };
    const summary = summarizeDeletionImpact(impact);
    expect(summary.items).toEqual([
      { kind: "player", text: "1 joueur" },
      { kind: "measurement", text: "2 mesures physiques" },
    ]);
    expect(summary).toMatchObject({ hasUnknown: false, isIncomplete: false, isEmpty: false });
  });

  it("tout à 0 → vide", () => {
    const summary = summarizeDeletionImpact({ complete: true, lines: [{ kind: "game", count: 0 }] });
    expect(summary).toMatchObject({ items: [], isEmpty: true, hasUnknown: false, isIncomplete: false });
  });

  it("un null est gardé et signalé", () => {
    const summary = summarizeDeletionImpact({ complete: true, lines: [{ kind: "game", count: null }] });
    expect(summary.items).toEqual([{ kind: "game", text: "un nombre indéterminé de matchs" }]);
    expect(summary).toMatchObject({ hasUnknown: true, isEmpty: false });
  });

  it("complete: false → incomplet, même sans ligne", () => {
    const summary = summarizeDeletionImpact({ complete: false, lines: [] });
    expect(summary).toMatchObject({ isIncomplete: true, isEmpty: true });
  });
});
