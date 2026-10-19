import Link from "next/link";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { ADMIN_LIST_SEARCH_MAX_LENGTH } from "@/models/AdminListQuery";
import { buildAdminHref } from "@/models/buildAdminHref";

type SeasonCandidateSearchProps = {
  seasonId: number;
  query: string;
};

/**
 * Recherche des joueurs à inscrire : un vrai formulaire GET (clavier, sans JavaScript) qui recharge la page sur
 * `?q=` et ramène à la section des participants.
 */
export function SeasonCandidateSearch({ seasonId, query }: SeasonCandidateSearchProps) {
  const editHref = buildAdminHref("season", { kind: "edit", id: seasonId });
  const sectionHref = `${editHref}#participants`;

  return (
    <form
      method="get"
      action={sectionHref}
      role="search"
      aria-label="Rechercher un joueur à inscrire"
      className="flex flex-wrap items-end gap-3"
    >
      <div className="min-w-0 flex-[2_1_260px]">
        <TextField
          label="Rechercher un joueur à inscrire"
          name="q"
          type="search"
          defaultValue={query}
          maxLength={ADMIN_LIST_SEARCH_MAX_LENGTH}
          autoComplete="off"
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <PrimaryButton size="tall" type="submit">
          Rechercher
        </PrimaryButton>
        {query !== "" && (
          <Link
            href={sectionHref}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-rpb-bordeaux underline underline-offset-[3px] hover:text-rpb-bordeaux-dark focus-ring"
          >
            Effacer la recherche
          </Link>
        )}
      </div>
    </form>
  );
}
