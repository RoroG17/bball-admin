import { describe, expect, it } from "vitest";
import { classifyShotZone } from "@/models/classifyShotZone";

describe("classifyShotZone", () => {
  it("raquette sous le panier", () => expect(classifyShotZone({ x: 375, y: 100 })).toBe("paint"));
  it("mi-distance entre la raquette et l'arc", () => expect(classifyShotZone({ x: 375, y: 300 })).toBe("midRange"));
  it("3 points au-delà de l'arc", () => expect(classifyShotZone({ x: 375, y: 400 })).toBe("threePoint"));
  it("3 points dans le corner", () => expect(classifyShotZone({ x: 100, y: 20 })).toBe("threePoint"));
});
