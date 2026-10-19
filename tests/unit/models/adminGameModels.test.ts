import { describe, expect, it } from "vitest";
import { GAME_COMPARATORS, compareAdminGameRows } from "@/models/adminGameComparators";
import { GAME_MESSAGES } from "@/models/adminGameMessages";
import { ADMIN_REVALIDATION } from "@/models/adminRevalidation";
import { buildAdminGameCreateHref } from "@/models/buildAdminGameCreateHref";
import { buildAdminGameListHref } from "@/models/buildAdminGameListHref";
import { classifyGameNotFound } from "@/models/classifyGameNotFound";
import { computeGameDeletionImpact } from "@/models/computeGameDeletionImpact";
import { describeAdminGameTarget } from "@/models/describeAdminGameTarget";
import { describeGameWarning } from "@/models/describeGameWarning";
import { describeVideoFeedback } from "@/models/describeVideoFeedback";
import { filterAdminGameRows } from "@/models/filterAdminGameRows";
import { filterUnacknowledgedWarnings } from "@/models/filterUnacknowledgedWarnings";
import { formatAdminGameTitle } from "@/models/formatAdminGameTitle";
import type { GameDetail } from "@/models/GameDetail";
import { GAME_FIELDS, type GameFormField } from "@/models/GameFormField";
import { GameFixedTeamsFormSchema, GameFormSchema } from "@/models/GameInput";
import { getAdminGameRowActions } from "@/models/getAdminGameRowActions";
import { getAdminGameStatsLabel } from "@/models/getAdminGameStatsLabel";
import { getGameFormWarnings } from "@/models/getGameFormWarnings";
import { parseGameScores } from "@/models/parseGameScores";
import { parseVideoInput } from "@/models/parseVideoInput";
import { resolveGameListRequest } from "@/models/resolveGameListRequest";
import { resolveGameTeams } from "@/models/resolveGameTeams";
import { sortRows } from "@/models/sortRows";
import { toAdminGameRow } from "@/models/toAdminGameRow";
import { toGameFormValues } from "@/models/toGameFormValues";
import { toGameSeasonOptions } from "@/models/toGameSeasonOptions";
import { toVideoFieldValue } from "@/models/toVideoFieldValue";
import { toVideoPayloadValue } from "@/models/toVideoPayloadValue";
import { toWarningState } from "@/models/toWarningState";
import { makeGame, makeSeason } from "./factories";

const VALID = { seasonId: "4", round: "5", date: "2026-01-12", side: "home", opponentId: "14" };
const errorsOf = (values: Record<string, string>) => {
  const result = GameFormSchema.safeParse(values);
  if (result.success) return {};
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) out[String(issue.path[0])] ??= issue.message;
  return out;
};
const blank = Object.fromEntries(GAME_FIELDS.map((field) => [field, ""])) as Record<GameFormField, string>;

describe("GameFormSchema", () => {
  it("valeurs valides : sorties numériques", () => {
    expect(GameFormSchema.parse({ ...VALID, round: " 5 " })).toEqual({ seasonId: 4, round: 5, date: "2026-01-12", side: "home", opponentId: 14 });
  });
  it("tout vide : une erreur par champ", () => {
    expect(errorsOf(blank)).toEqual({
      seasonId: GAME_MESSAGES.seasonRequired,
      round: GAME_MESSAGES.roundRequired,
      date: GAME_MESSAGES.dateRequired,
      side: GAME_MESSAGES.sideRequired,
      opponentId: GAME_MESSAGES.opponentRequired,
    });
  });
  it.each(["0", "-1", "1.5", "1e2", "1000", "abc"])("journée %s refusée", (round) => {
    expect(errorsOf({ ...VALID, round }).round).toBe(GAME_MESSAGES.roundInvalid);
  });
  it("journée 999 acceptée, date inexistante refusée, saison non numérique refusée", () => {
    expect(errorsOf({ ...VALID, round: "999" })).toEqual({});
    expect(errorsOf({ ...VALID, date: "2026-02-30" }).date).toBe(GAME_MESSAGES.dateInvalid);
    expect(errorsOf({ ...VALID, seasonId: "abc" }).seasonId).toBe(GAME_MESSAGES.seasonInvalid);
    expect(errorsOf({ ...VALID, side: "autre" }).side).toBe(GAME_MESSAGES.sideRequired);
  });
  it("match hérité : ni côté ni adversaire demandés", () => {
    expect(GameFixedTeamsFormSchema.safeParse({ ...VALID, side: "", opponentId: "" }).success).toBe(true);
  });
});

describe("parseGameScores", () => {
  it("deux vides ou 0/0 : non joué", () => {
    expect(parseGameScores("", "  ")).toEqual({ kind: "score", home: 0, away: 0 });
    expect(parseGameScores("0", "0")).toEqual({ kind: "score", home: 0, away: 0 });
  });
  it("un seul vide : erreur sur le champ vide", () => {
    expect(parseGameScores("78", "")).toEqual({ kind: "invalid", errors: { awayScore: GAME_MESSAGES.scoreMissingOther } });
    expect(parseGameScores("", "65")).toEqual({ kind: "invalid", errors: { homeScore: GAME_MESSAGES.scoreMissingOther } });
  });
  it.each(["-3", "12.5", "1234", "1e3", "7 8"])("%s refusé", (value) => {
    expect(parseGameScores(value, "10")).toMatchObject({ kind: "invalid", errors: { homeScore: GAME_MESSAGES.scoreInvalid } });
  });
  it("espaces autour acceptés, forfait 0/20", () => {
    expect(parseGameScores(" 78 ", "65")).toEqual({ kind: "score", home: 78, away: 65 });
    expect(parseGameScores("0", "20")).toEqual({ kind: "score", home: 0, away: 20 });
  });
});

describe("resolveGameTeams", () => {
  it("RPB à domicile ou à l'extérieur", () => {
    expect(resolveGameTeams({ side: "home", opponentId: 14 }, 1)).toEqual({ ok: true, homeTeamId: 1, awayTeamId: 14 });
    expect(resolveGameTeams({ side: "away", opponentId: 14 }, 1)).toEqual({ ok: true, homeTeamId: 14, awayTeamId: 1 });
  });
  it("saison sans RPB et adversaire = RPB refusés", () => {
    expect(resolveGameTeams({ side: "home", opponentId: 14 }, null)).toMatchObject({ ok: false, field: "seasonId" });
    expect(resolveGameTeams({ side: "home", opponentId: 1 }, 1)).toMatchObject({ ok: false, field: "opponentId" });
  });
});

describe("vidéo", () => {
  const none = { kind: "none" } as const;
  const yt = { kind: "youtube", videoId: "t8QR6Oq4i5s" } as const;
  const bad = { kind: "invalid", raw: "n'importe quoi" } as const;
  it("parseVideoInput", () => {
    expect(parseVideoInput("", none)).toEqual({ kind: "none" });
    expect(parseVideoInput("", yt)).toEqual({ kind: "removalUnsupported" });
    expect(parseVideoInput("https://www.youtube.com/watch?v=abcdefghijk", none)).toEqual({ kind: "set", videoId: "abcdefghijk" });
    expect(parseVideoInput("https://youtu.be/abcdefghijk", yt)).toEqual({ kind: "set", videoId: "abcdefghijk" });
    expect(parseVideoInput("abcdefghijk", none)).toEqual({ kind: "set", videoId: "abcdefghijk" });
    expect(parseVideoInput("texte libre", none)).toEqual({ kind: "invalid" });
    expect(parseVideoInput("n'importe quoi", bad)).toEqual({ kind: "unchanged" });
  });
  it("toVideoFieldValue / toVideoPayloadValue", () => {
    expect([toVideoFieldValue(none), toVideoFieldValue(yt), toVideoFieldValue(bad)]).toEqual(["", "t8QR6Oq4i5s", "n'importe quoi"]);
    expect(toVideoPayloadValue({ kind: "set", videoId: "abcdefghijk" }, none)).toBe("abcdefghijk");
    expect(toVideoPayloadValue({ kind: "unchanged" }, bad)).toBe("n'importe quoi");
    expect(toVideoPayloadValue({ kind: "unchanged" }, yt)).toBe("t8QR6Oq4i5s");
    expect(toVideoPayloadValue({ kind: "none" }, none)).toBeNull();
  });
  it("describeVideoFeedback", () => {
    expect(describeVideoFeedback("", none)).toBeNull();
    expect(describeVideoFeedback("https://youtu.be/abcdefghijk", none)).toMatchObject({ tone: "ok", videoId: "abcdefghijk" });
    expect(describeVideoFeedback("n'importe quoi", bad)).toMatchObject({ tone: "warning", videoId: null });
    expect(describeVideoFeedback("zzz", none)).toMatchObject({ tone: "error", text: GAME_MESSAGES.videoInvalid });
    expect(describeVideoFeedback("", yt)).toMatchObject({ tone: "error", text: GAME_MESSAGES.videoRemovalUnsupported });
  });
});

describe("classifyGameNotFound", () => {
  it("phrases du back", () => {
    expect(classifyGameNotFound("Match non trouvé")).toBe("game");
    expect(classifyGameNotFound("La saison n'existe pas")).toBe("season");
    expect(classifyGameNotFound("L'équipe n'existe pas")).toBe("team");
    expect(classifyGameNotFound("Autre chose")).toBe("unknown");
    expect(classifyGameNotFound(null)).toBe("unknown");
  });
});

describe("getGameFormWarnings", () => {
  const season = makeSeason({ id: 4, startYear: 2025, endYear: 2026, teamId: 1 });
  const current = makeGame(54, 50, "OTB", "FAC", { id: 47, number: 9, date: "2026-01-24", homeTeamId: 14, awayTeamId: 1 });
  const values = { seasonId: 4, round: 9, date: "2026-01-24", homeTeamId: 14, awayTeamId: 1 };
  const scores = { home: 54, away: 50 };
  const ctx = (over: Partial<Parameters<typeof getGameFormWarnings>[0]> = {}) => ({
    values,
    scores,
    season,
    seasonGames: [current],
    current: { game: current, seasonId: 4, statLineCount: 10 },
    ...over,
  });

  it("création : doublon de journée et date hors saison (bornes incluses)", () => {
    const base = { values: { ...values, round: 9 }, scores: { home: 0, away: 0 }, season, current: null };
    expect(getGameFormWarnings({ ...base, seasonGames: [current] }).map((w) => w.kind)).toEqual(["duplicateRound"]);
    expect(getGameFormWarnings({ ...base, values: { ...values, round: 10, date: "2025-09-01" }, seasonGames: [current] })).toEqual([]);
    expect(getGameFormWarnings({ ...base, values: { ...values, round: 10, date: "2026-12-31" }, seasonGames: [] })).toEqual([]);
    expect(getGameFormWarnings({ ...base, values: { ...values, round: 10, date: "2027-01-01" }, seasonGames: [] })).toEqual([
      { kind: "dateOutsideSeason", startYear: 2025, endYear: 2026 },
    ]);
  });
  it("édition : rien ne change, rien n'est signalé", () => {
    expect(getGameFormWarnings(ctx())).toEqual([]);
  });
  it("changement de saison avec stats : statsMove chiffré ; sans stats : rien ; inconnu : statsMove", () => {
    const moved = { values: { ...values, seasonId: 1 }, season: makeSeason({ id: 1, startYear: 2025, endYear: 2026 }), seasonGames: [] };
    expect(getGameFormWarnings(ctx(moved))).toEqual([{ kind: "statsMove", statLineCount: 10, changed: ["season"] }]);
    expect(getGameFormWarnings(ctx({ ...moved, current: { game: current, seasonId: 4, statLineCount: 0 } }))).toEqual([]);
    expect(getGameFormWarnings(ctx({ ...moved, current: { game: current, seasonId: 4, statLineCount: null } }))[0]).toMatchObject({
      kind: "statsMove",
      statLineCount: null,
    });
  });
  it("changement d'équipe seul", () => {
    const warnings = getGameFormWarnings(ctx({ values: { ...values, awayTeamId: 7 } }));
    expect(warnings).toEqual([{ kind: "statsMove", statLineCount: 10, changed: ["teams"] }]);
  });
  it("doublon préexistant non re-signalé ; journée modifiée vers un doublon signalée", () => {
    const other = makeGame(0, 0, "A", "B", { id: 99, number: 9 });
    expect(getGameFormWarnings(ctx({ seasonGames: [current, other] }))).toEqual([]);
    const moved = getGameFormWarnings(ctx({ values: { ...values, round: 4 }, seasonGames: [current, makeGame(0, 0, "A", "B", { id: 98, number: 4 })] }));
    expect(moved).toEqual([{ kind: "duplicateRound", round: 4 }]);
  });
  it("égalité : seulement si modifiée, jamais 0-0", () => {
    const tied = makeGame(70, 70, "A", "B", { id: 47, number: 9, date: "2026-01-24", homeTeamId: 14, awayTeamId: 1 });
    expect(getGameFormWarnings(ctx({ scores: { home: 70, away: 70 }, current: { game: tied, seasonId: 4, statLineCount: 10 } }))).toEqual([]);
    expect(getGameFormWarnings(ctx({ scores: { home: 60, away: 60 } }))).toEqual([{ kind: "scoreTie", score: 60 }]);
    expect(getGameFormWarnings(ctx({ scores: { home: 0, away: 0 } }))).toEqual([]);
  });
  it("ordre fixe", () => {
    const warnings = getGameFormWarnings(
      ctx({
        values: { ...values, seasonId: 1, round: 5, date: "2030-01-01" },
        season: makeSeason({ id: 1 }),
        seasonGames: [makeGame(0, 0, "A", "B", { id: 3, number: 5 })],
        scores: { home: 60, away: 60 },
      }),
    );
    expect(warnings.map((w) => w.kind)).toEqual(["statsMove", "duplicateRound", "dateOutsideSeason", "scoreTie"]);
  });
});

describe("avertissements : acquittement et textes", () => {
  it("filterUnacknowledgedWarnings / toWarningState", () => {
    const warnings = [
      { kind: "duplicateRound", round: 3 },
      { kind: "scoreTie", score: 60 },
    ] as const;
    const values = { ...blank, ackDuplicateRound: "on" };
    expect(filterUnacknowledgedWarnings(warnings, values)).toEqual([{ kind: "scoreTie", score: 60 }]);
    const state = toWarningState(blank, warnings);
    expect(state.message).toBe(GAME_MESSAGES.warningsIntro);
    expect(Object.keys(state.fieldErrors)).toEqual(["ackDuplicateRound", "ackScoreTie"]);
  });
  it("describeGameWarning : singulier, pluriel, inconnu", () => {
    expect(describeGameWarning({ kind: "statsMove", statLineCount: 1, changed: ["season"] })).toContain("1 ligne de statistiques");
    expect(describeGameWarning({ kind: "statsMove", statLineCount: 38, changed: ["season"] })).toContain("38 lignes de statistiques");
    expect(describeGameWarning({ kind: "statsMove", statLineCount: null, changed: ["teams"] })).toContain("inconnu");
    expect(describeGameWarning({ kind: "dateOutsideSeason", startYear: 2025, endYear: 2026 })).toBe("Cette date n'est pas dans la saison 2025-2026.");
  });
});

describe("liste", () => {
  const seasons = [makeSeason({ id: 1, startYear: 2024, endYear: 2025 }), makeSeason({ id: 4, startYear: 2025, endYear: 2026 })];
  const rpb = { id: 1, name: "FAC Basket" };
  const mk = (id: number, number: number, date: string, h: number, a: number, home = "FAC Basket", away = "OTB") =>
    makeGame(h, a, home, away, { id, number, date });

  it("buildAdminGameListHref / buildAdminGameCreateHref", () => {
    expect(buildAdminGameListHref(4)).toBe("/admin/game?saison=4");
    expect(buildAdminGameListHref(4, { q: "otb" })).toBe("/admin/game?q=otb&saison=4");
    expect(buildAdminGameListHref(4, undefined, { code: "created", ref: 54 })).toBe("/admin/game?saison=4&notice=created&ref=54");
    expect(buildAdminGameListHref(null)).toBe("/admin/game");
    expect(buildAdminGameCreateHref(4)).toBe("/admin/game/create?saison=4");
  });
  it("resolveGameListRequest : saison par défaut, inconnue, valide, notice conservée, idempotence", () => {
    const none = resolveGameListRequest({}, seasons);
    expect(none.season?.id).toBe(4);
    expect(none.redirectTo).toBe("/admin/game?saison=4");
    expect(resolveGameListRequest({ saison: "999" }, seasons).redirectTo).toBe("/admin/game?saison=4");
    expect(resolveGameListRequest({ saison: "1" }, seasons).redirectTo).toBeNull();
    expect(resolveGameListRequest({ saison: "1", page: "1" }, seasons).redirectTo).toBe("/admin/game?saison=1");
    expect(resolveGameListRequest({ notice: "updated", ref: "47" }, seasons).redirectTo).toBe("/admin/game?saison=4&notice=updated&ref=47");
    for (const raw of [{}, { saison: "999" }, { saison: "004", q: " x " }, { saison: "1", page: "1" }, { notice: "deleted" }]) {
      const target = resolveGameListRequest(raw, seasons).redirectTo;
      if (target) {
        const params = Object.fromEntries(new URL(target, "http://x").searchParams);
        expect(resolveGameListRequest(params, seasons).redirectTo).toBeNull();
      }
    }
  });
  it("aucune saison : pas de redirection", () => {
    expect(resolveGameListRequest({}, [])).toMatchObject({ season: null, redirectTo: null });
  });
  it("toAdminGameRow / getAdminGameStatsLabel / getAdminGameRowActions", () => {
    const today = "2026-02-01";
    const played = toAdminGameRow(mk(1, 1, "2026-01-10", 60, 50), rpb, today, new Set([1]));
    expect(played.awaitingStats).toBe(true);
    expect(getAdminGameStatsLabel(played)).toBe("awaiting");
    expect(getAdminGameStatsLabel(toAdminGameRow(mk(2, 2, "2026-01-10", 60, 50), rpb, today, new Set()))).toBe("entered");
    expect(getAdminGameStatsLabel(toAdminGameRow(mk(3, 3, "2026-01-10", 60, 50), rpb, today, null))).toBe("unknown");
    const missing = toAdminGameRow(mk(4, 4, "2026-01-10", 0, 0), rpb, today, new Set([4]));
    expect(missing.awaitingStats).toBe(false);
    expect(getAdminGameStatsLabel(missing)).toBe("notApplicable");
    expect(getAdminGameStatsLabel(toAdminGameRow(mk(5, 5, "2026-03-10", 0, 0), rpb, today, null))).toBe("notApplicable");
    expect(played.entry.rpbSide).toBe("home");
    expect(getAdminGameRowActions(played, { enterStatsAvailable: false })).toEqual(["view", "edit", "delete"]);
    expect(getAdminGameRowActions(played, { enterStatsAvailable: true })).toEqual(["view", "edit", "enterStats", "delete"]);
  });
  it("filtre (accents, casse, mots) et tri date puis journée, ex æquo déterministe", () => {
    const rows = [
      toAdminGameRow(mk(3, 2, "2026-01-10", 1, 2, "FAC Basket", "Étoile Cugnaux"), rpb, "2026-02-01", null),
      toAdminGameRow(mk(2, 1, "2026-01-10", 1, 2), rpb, "2026-02-01", null),
      toAdminGameRow(mk(1, 3, "2026-01-03", 1, 2), rpb, "2026-02-01", null),
    ];
    expect(filterAdminGameRows(rows, "ETOILE cugnaux")).toHaveLength(1);
    expect(filterAdminGameRows(rows, "fac otb")).toHaveLength(2);
    expect(filterAdminGameRows(rows, "")).toHaveLength(3);
    expect(sortRows(rows, { column: "date", direction: "asc" }, GAME_COMPARATORS, compareAdminGameRows).map((r) => r.entry.game.id)).toEqual([1, 2, 3]);
    expect(sortRows(rows, { column: "date", direction: "desc" }, GAME_COMPARATORS, compareAdminGameRows).map((r) => r.entry.game.id)).toEqual([3, 2, 1]);
    expect(sortRows(rows, { column: "round", direction: "asc" }, GAME_COMPARATORS, compareAdminGameRows).map((r) => r.entry.game.number)).toEqual([1, 2, 3]);
  });
});

describe("impact, titres, formulaire, révalidation", () => {
  it("computeGameDeletionImpact", () => {
    expect(computeGameDeletionImpact(38)).toEqual({ lines: [{ kind: "statLine", count: 38 }], complete: true });
    expect(computeGameDeletionImpact(null)).toEqual({ lines: [{ kind: "statLine", count: null }], complete: false });
  });
  it("formatAdminGameTitle / describeAdminGameTarget : date UTC", () => {
    const game = makeGame(78, 65, "RPB U17", "OTB", { number: 5, date: "2026-01-12" });
    expect(formatAdminGameTitle(game)).toBe("Journée 5 · RPB U17 contre OTB · 12 janvier 2026");
    expect(describeAdminGameTarget(game)).toBe("le match de la journée 5, RPB U17 contre OTB, 12 janvier 2026");
  });
  it("toGameFormValues", () => {
    const detail = (home: number, away: number, hs: number, as: number, video: GameDetail["video"] = { kind: "none" }): GameDetail => ({
      game: makeGame(hs, as, "A", "B", { id: 7, number: 3, date: "2026-02-21", homeTeamId: home, awayTeamId: away }),
      seasonId: 4,
      video,
    });
    const season = makeSeason({ id: 4, teamId: 1 });
    expect(toGameFormValues(detail(1, 14, 0, 0), season)).toMatchObject({
      teamsMode: "rpb",
      values: { side: "home", opponentId: "14", homeScore: "", awayScore: "", round: "3", date: "2026-02-21" },
    });
    expect(toGameFormValues(detail(14, 1, 0, 20), season).values).toMatchObject({ side: "away", opponentId: "14", homeScore: "0", awayScore: "20" });
    expect(toGameFormValues(detail(8, 9, 1, 2), season)).toMatchObject({ teamsMode: "fixed", values: { side: "", opponentId: "" } });
    expect(toGameFormValues(detail(1, 14, 1, 2, { kind: "youtube", videoId: "abcdefghijk" }), season).values.video).toBe("abcdefghijk");
  });
  it("toGameSeasonOptions", () => {
    const options = toGameSeasonOptions([makeSeason({ id: 1, startYear: 2024, endYear: 2025, teamId: 1 }), makeSeason({ id: 4, teamId: null })], [{ id: 1, name: "FAC Basket" }]);
    expect(options.map((o) => [o.id, o.rpbTeamName])).toEqual([[4, null], [1, "FAC Basket"]]);
  });
  it("ADMIN_REVALIDATION.game : palmarès sur update et delete, pas create", () => {
    expect(ADMIN_REVALIDATION.game.hallOfFameOn).toEqual(["update", "delete"]);
  });
});
