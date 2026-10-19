import { useId, useRef } from "react";
import { CrossIcon } from "@/components/ui/icons/CrossIcon";
import { SearchIcon } from "@/components/ui/icons/SearchIcon";

type PlayerSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function PlayerSearchField({ value, onChange }: PlayerSearchFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex max-w-[480px] flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[13px] font-semibold">
        Rechercher un joueur
      </label>
      <div className="relative flex items-center">
        <SearchIcon size={20} strokeWidth={2.2} className="pointer-events-none absolute left-3.5 text-rpb-ink/72" />
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          autoComplete="off"
          placeholder="Nom ou prénom"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[52px] w-full appearance-none rounded-lg border-2 border-rpb-ink bg-rpb-cream pr-28 pl-11 text-base font-medium text-rpb-ink focus-ring placeholder:text-rpb-ink/72 [&::-webkit-search-cancel-button]:hidden"
        />
        {value !== "" && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="absolute top-1/2 right-1 inline-flex min-h-11 -translate-y-1/2 items-center gap-1 rounded-md px-2.5 text-sm font-semibold text-rpb-bordeaux focus-ring hover:bg-rpb-gold-light"
          >
            <CrossIcon size={14} strokeWidth={2.5} />
            Effacer
          </button>
        )}
      </div>
    </div>
  );
}
