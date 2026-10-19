import type { FormValues } from "@/models/FormState";

/** Lit chaque champ en chaîne : `""` si absent ou si la valeur est un fichier. Aucune coercition, aucun `trim`. */
export function readFormValues<F extends string>(formData: FormData, fields: readonly F[]): FormValues<F> {
  const values = {} as Record<F, string>;
  for (const field of fields) {
    const value = formData.get(field);
    values[field] = typeof value === "string" ? value : "";
  }
  return values;
}
