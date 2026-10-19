import Link from "next/link";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import {
  LOG_FILTER_MAX_LENGTHS,
  LOG_STATUS_FILTER_LABELS,
  LOG_STATUS_FILTER_OPTIONS,
  type LogFilterKey,
} from "@/models/LogFilters";
import { DEFAULT_LOG_KIND, LOG_KIND_LABELS, LOG_KIND_PARAMS } from "@/models/LogKind";
import type { LogListQuery } from "@/models/LogListQuery";
import { LOG_SOURCE_LABELS, LOG_SOURCES } from "@/models/LogSource";
import { buildLogListHref } from "@/models/buildLogListHref";

type LogFilterBarProps = {
  query: LogListQuery;
  /** Filtres proposés ET appliqués par le back (`getActiveLogFilters`). */
  activeFilters: readonly LogFilterKey[];
  /** Jour de Paris d'aujourd'hui (`YYYY-MM-DD`). */
  maxDate: string;
};

const FIELD = "min-w-0 flex-[1_1_200px]";

/**
 * Filtres en formulaire GET (aucun JavaScript). Seuls les filtres actifs sont affichés. Ni `page` ni `detail` : appliquer
 * un filtre revient en page 1. Le `key` remonte les champs non contrôlés quand l'URL change (« Réinitialiser »).
 */
export function LogFilterBar({ query, activeFilters, maxDate }: LogFilterBarProps) {
  if (activeFilters.length === 0) return null;
  const { filters } = query;
  const has = (key: LogFilterKey) => activeFilters.includes(key);
  const resetHref = buildLogListHref({ kind: query.kind, filters: {}, page: 1, detailId: null });
  const isFiltered = Object.keys(filters).length > 0;
  const formKey = buildLogListHref({ ...query, page: 1, detailId: null });

  return (
    <form
      key={formKey}
      method="get"
      action="/admin/logs"
      role="search"
      aria-label={`Filtrer les ${LOG_KIND_LABELS[query.kind].plural}`}
      className="flex flex-wrap items-end gap-3 rounded-lg border-2 border-rpb-ink/14 bg-rpb-cream p-4"
    >
      {query.kind !== DEFAULT_LOG_KIND && <input type="hidden" name="type" value={LOG_KIND_PARAMS[query.kind]} />}
      {has("utilisateur") && (
        <div className={FIELD}>
          <TextField
            label="Nom d'utilisateur"
            name="utilisateur"
            defaultValue={filters.utilisateur}
            hint="Nom exact"
            maxLength={LOG_FILTER_MAX_LENGTHS.utilisateur}
            autoComplete="off"
          />
        </div>
      )}
      {has("plateforme") && (
        <div className={FIELD}>
          <SelectField
            label="Plateforme"
            name="plateforme"
            placeholder="Toutes"
            defaultValue={filters.plateforme ?? ""}
            options={[
              { value: "web", label: "Web" },
              { value: "mobile", label: "Mobile" },
            ]}
          />
        </div>
      )}
      {has("os") && (
        <div className={FIELD}>
          <TextField
            label="Système (contient)"
            name="os"
            defaultValue={filters.os}
            maxLength={LOG_FILTER_MAX_LENGTHS.os}
            autoComplete="off"
          />
        </div>
      )}
      {has("source") && (
        <div className={FIELD}>
          <SelectField
            label="Source"
            name="source"
            placeholder="Toutes"
            defaultValue={filters.source ?? ""}
            hint={`Serveur : ${LOG_SOURCE_LABELS.server.hint.charAt(0).toLowerCase()}${LOG_SOURCE_LABELS.server.hint.slice(1)}. Client : ${LOG_SOURCE_LABELS.client.hint.charAt(0).toLowerCase()}${LOG_SOURCE_LABELS.client.hint.slice(1)}.`}
            options={LOG_SOURCES.map((source) => ({ value: source, label: LOG_SOURCE_LABELS[source].label }))}
          />
        </div>
      )}
      {has("route") && (
        <div className={FIELD}>
          <TextField
            label="Route (contient)"
            name="route"
            defaultValue={filters.route}
            maxLength={LOG_FILTER_MAX_LENGTHS.route}
            autoComplete="off"
          />
        </div>
      )}
      {has("statut") && (
        <div className={FIELD}>
          <SelectField
            label="Statut"
            name="statut"
            placeholder="Tous"
            defaultValue={filters.statut ?? ""}
            options={LOG_STATUS_FILTER_OPTIONS[query.kind].map((status) => ({
              value: status,
              label: LOG_STATUS_FILTER_LABELS[status],
            }))}
          />
        </div>
      )}
      {has("du") && (
        <div className={FIELD}>
          <TextField label="Du" name="du" type="date" defaultValue={filters.du} max={maxDate} hint="Jour, heure de Paris" />
        </div>
      )}
      {has("au") && (
        <div className={FIELD}>
          <TextField label="Au" name="au" type="date" defaultValue={filters.au} max={maxDate} hint="Jour, heure de Paris" />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <PrimaryButton size="tall" type="submit">
          Filtrer
        </PrimaryButton>
        {isFiltered && (
          <Link
            href={resetHref}
            prefetch={false}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-rpb-bordeaux underline underline-offset-[3px] hover:text-rpb-bordeaux-dark focus-ring"
          >
            Réinitialiser
          </Link>
        )}
      </div>
    </form>
  );
}
