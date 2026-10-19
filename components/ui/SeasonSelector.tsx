"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { ChevronDownIcon } from "@/components/ui/icons/ChevronDownIcon";
import { cx } from "@/lib/cx";

export type SeasonOption = { id: number | string; label: string };

type SeasonSelectorProps = {
  options: SeasonOption[];
  selectedId: number | string;
  /** Chemin de la page qui reçoit `?saison=` (ex. `"/"`, `"/game"`). */
  basePath: string;
  /** Paramètres à conserver dans l'URL (ex. `{ onglet: "examens" }`). */
  query?: Record<string, string>;
  /** Libellé du champ (défaut : « Saison affichée »). */
  label?: string;
  className?: string;
};

/**
 * Sélecteur contrôlé : la valeur affichée est toujours la saison de l'URL.
 * Le parent le remonte (`key`) à chaque changement de saison.
 */
export function SeasonSelector({
  options,
  selectedId,
  basePath,
  query,
  label = "Saison affichée",
  className,
}: SeasonSelectorProps) {
  const router = useRouter();
  const selectId = useId();
  const [value, setValue] = useState(String(selectedId));
  const [isPending, startTransition] = useTransition();

  function handleChange(nextValue: string) {
    // L'identifiant d'origine de l'option est renvoyé tel quel (nombre ou texte).
    const option = options.find((candidate) => String(candidate.id) === nextValue);
    if (!option) return;
    setValue(nextValue);
    startTransition(() => {
      router.push(`${basePath}?${new URLSearchParams({ ...query, saison: String(option.id) })}`);
    });
  }

  return (
    <div className={cx("flex min-w-0 flex-col gap-1.5", className ?? "flex-[0_1_340px]")}>
      <label htmlFor={selectId} className="text-[13px] font-semibold">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={value}
          aria-busy={isPending}
          onChange={(event) => handleChange(event.target.value)}
          className={cx(
            "min-h-[46px] w-full appearance-none rounded-lg border-2 border-rpb-ink bg-rpb-cream py-2.5 pr-10 pl-3.5 text-[15px] font-semibold text-rpb-ink focus-ring",
            isPending && "opacity-60",
          )}
        >
          {options.map((option) => (
            <option key={option.id} value={String(option.id)}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon size={18} strokeWidth={2.5} className="pointer-events-none absolute top-3.5 right-3.5 text-rpb-ink" />
      </div>
    </div>
  );
}
