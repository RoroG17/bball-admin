import { describe, expect, it } from "vitest";
import {
  capitalizeFirst,
  formatCount,
  formatDate,
  formatDateTime,
  formatDurationMs,
  formatDecimal,
  formatMeasurementValue,
  formatGameDate,
  formatGameDateShort,
  formatPercent,
  formatPercentDecimal,
  formatPlayingTime,
  formatShootingRatio,
  formatSignedDecimal,
  pluralize,
} from "@/lib/format";

describe("formatDecimal", () => {
  it("formate à la française sans zéro inutile", () => {
    expect(formatDecimal(12)).toBe("12");
    expect(formatDecimal(12.5)).toBe("12,5");
    expect(formatDecimal(12.25)).toBe("12,3");
    expect(formatDecimal(15.714, 2)).toBe("15,71");
  });
});

describe("formatPercent", () => {
  it("arrondit à l'entier avec une espace insécable", () => {
    expect(formatPercent(0.727)).toBe("73 %");
    expect(formatPercent(0)).toBe("0 %");
  });
});

describe("formatCount", () => {
  it("formate selon le type de chiffre", () => {
    expect(formatCount(71.6, "integer")).toBe("72");
    expect(formatCount(58.31, "decimal")).toBe("58,3");
    expect(formatCount(61.1, "percent")).toBe("61 %");
  });
});

describe("formatGameDate", () => {
  it("affiche la date longue en français", () => {
    expect(formatGameDate("2026-10-17")).toBe("samedi 17 octobre 2026");
    expect(formatGameDateShort("2026-02-21")).toBe("samedi 21 février");
  });

  it("ne recule pas d'un jour quel que soit le fuseau du serveur", () => {
    const previousTz = process.env.TZ;
    process.env.TZ = "America/Los_Angeles";
    try {
      expect(formatGameDate("2026-05-09")).toBe("samedi 9 mai 2026");
    } finally {
      process.env.TZ = previousTz;
    }
  });
});

describe("capitalizeFirst", () => {
  it("met la première lettre en majuscule", () => {
    expect(capitalizeFirst("samedi 21 février 2026")).toBe("Samedi 21 février 2026");
    expect(capitalizeFirst("")).toBe("");
  });
});

describe("formatSignedDecimal", () => {
  it("signe les valeurs non nulles avec le vrai signe moins", () => {
    expect(formatSignedDecimal(124)).toBe("+124");
    expect(formatSignedDecimal(-4)).toBe("−4");
    expect(formatSignedDecimal(0)).toBe("0");
    expect(formatSignedDecimal(7.333)).toBe("+7,3");
  });
});

describe("pluralize", () => {
  it("accorde au singulier pour 0 et 1, au pluriel au-delà", () => {
    expect(pluralize(0, "match", "matchs")).toBe("0 match");
    expect(pluralize(1, "match nul", "matchs nuls")).toBe("1 match nul");
    expect(pluralize(22, "match", "matchs")).toBe("22 matchs");
  });
});

describe("formatPlayingTime", () => {
  it("affiche mm:ss sans plafonner les minutes", () => {
    expect(formatPlayingTime(1453)).toBe("24:13");
    expect(formatPlayingTime(302)).toBe("5:02");
    expect(formatPlayingTime(3840)).toBe("64:00");
    expect(formatPlayingTime(0)).toBe("0:00");
  });

  it("affiche un tiret pour un temps inconnu", () => {
    expect(formatPlayingTime(null)).toBe("—");
  });
});

describe("formatPercentDecimal", () => {
  it("garde une décimale avec une espace insécable", () => {
    expect(formatPercentDecimal(0.3871)).toBe("38,7 %");
    expect(formatPercentDecimal(1)).toBe("100 %");
    expect(formatPercentDecimal(0)).toBe("0 %");
    expect(formatPercentDecimal(0.3871, 0)).toBe("39 %");
  });

  it("affiche un tiret sans tentative", () => {
    expect(formatPercentDecimal(null)).toBe("—");
  });
});

describe("formatShootingRatio", () => {
  it("affiche réussis/tentés", () => {
    expect(formatShootingRatio(12, 31)).toBe("12/31");
    expect(formatShootingRatio(0, 0)).toBe("0/0");
  });
});

describe("formatDate / formatMeasurementValue", () => {
  it("formate une date longue ou courte, sans décalage de fuseau", () => {
    expect(formatDate("2026-03-12")).toBe("12 mars 2026");
    expect(formatDate("2026-01-01", "short")).toBe("01/01/2026");
    expect(formatDate("2025-12-31T23:30:00", "long")).toBe("31 décembre 2025");
  });

  it("ajoute l'unité après une espace insécable", () => {
    expect(formatMeasurementValue(182, "cm")).toBe("182 cm");
    expect(formatMeasurementValue(14.5, "km/h")).toBe("14,5 km/h");
  });
});

describe("formatDateTime", () => {
  it("heure d'été : 2026-10-12T12:02:11.000000Z → Paris +2 h, UTC inchangé", () => {
    expect(formatDateTime("2026-10-12T12:02:11.000000Z", "Europe/Paris")).toBe("12/10/2026 14:02:11");
    expect(formatDateTime("2026-10-12T12:02:11.000000Z", "UTC")).toBe("12/10/2026 12:02:11");
  });

  it("heure d'hiver : Paris +1 h", () => {
    expect(formatDateTime("2026-01-15T12:02:11Z", "Europe/Paris")).toBe("15/01/2026 13:02:11");
  });

  it("minuit s'écrit 00 (jamais 24) et le jour suit le fuseau", () => {
    expect(formatDateTime("2026-10-11T22:00:00Z", "Europe/Paris")).toBe("12/10/2026 00:00:00");
    expect(formatDateTime("2026-10-12T21:59:59Z", "Europe/Paris")).toBe("12/10/2026 23:59:59");
  });

  it("entrée invalide → « — »", () => {
    expect(formatDateTime("pas une date", "UTC")).toBe("—");
    expect(formatDateTime("", "Europe/Paris")).toBe("—");
  });
});

describe("formatDurationMs", () => {
  it("espace insécable avant l'unité, milliers séparés", () => {
    expect(formatDurationMs(845)).toBe("845 ms");
    expect(formatDurationMs(1234).replace(/[  ]/g, " ")).toBe("1 234 ms");
    expect(formatDurationMs(0)).toBe("0 ms");
  });
});
