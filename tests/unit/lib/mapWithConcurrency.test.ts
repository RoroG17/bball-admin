import { describe, expect, it } from "vitest";
import { mapWithConcurrency } from "@/lib/mapWithConcurrency";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("mapWithConcurrency", () => {
  it("préserve l'ordre du résultat", async () => {
    const result = await mapWithConcurrency([30, 5, 15, 1], 2, async (delay) => {
      await wait(delay);
      return delay * 2;
    });
    expect(result).toEqual([60, 10, 30, 2]);
  });

  it("n'exécute jamais plus de `limit` appels simultanés", async () => {
    let running = 0;
    let peak = 0;
    await mapWithConcurrency(Array.from({ length: 20 }, (_, index) => index), 6, async () => {
      running += 1;
      peak = Math.max(peak, running);
      await wait(3);
      running -= 1;
    });
    expect(peak).toBeLessThanOrEqual(6);
    expect(peak).toBeGreaterThan(1);
  });

  it("liste vide : tableau vide, sans appel", async () => {
    let calls = 0;
    expect(await mapWithConcurrency([], 6, async () => (calls += 1))).toEqual([]);
    expect(calls).toBe(0);
  });

  it.each([0, -3, Number.NaN])("limite %s : traitée comme 1", async (limit) => {
    let running = 0;
    let peak = 0;
    const result = await mapWithConcurrency([1, 2, 3], limit, async (value) => {
      running += 1;
      peak = Math.max(peak, running);
      await wait(2);
      running -= 1;
      return value;
    });
    expect(result).toEqual([1, 2, 3]);
    expect(peak).toBe(1);
  });

  it("propage l'erreur de `fn`", async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], 2, async (value) => {
        if (value === 2) throw new Error("boom");
        return value;
      }),
    ).rejects.toThrow("boom");
  });
});
