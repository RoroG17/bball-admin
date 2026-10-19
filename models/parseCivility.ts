import { CIVILITIES, type Civility } from "@/models/Civility";

/** Civilité du back reconnue (égalité exacte après `trim`), sinon `null` : `"m"`, `"Mr"`, `"Homme"` ne sont pas reconnues. */
export function parseCivility(raw: string): Civility | null {
  const value = raw.trim();
  return CIVILITIES.find((civility) => civility === value) ?? null;
}
