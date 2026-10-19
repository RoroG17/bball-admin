const COLLATOR = new Intl.Collator("fr", { sensitivity: "base", numeric: true });

/** Comparaison française (accents et casse ignorés, « 2 » avant « 10 ») ; `null` et vide après toute valeur. */
export function compareText(a: string | null, b: string | null): number {
  const aEmpty = a === null || a === "";
  const bEmpty = b === null || b === "";
  if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
  return COLLATOR.compare(a, b);
}
