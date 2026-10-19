import { formatDate, pluralize } from "@/lib/format";
import { computeAge } from "@/models/computeAge";

type AdminPlayerBirthCellProps = {
  /** `YYYY-MM-DD`. */
  birthDate: string;
  /** Date du jour à Paris. */
  today: string;
};

/** « 12/03/2011 · 15 ans » ; l'âge est omis si la date est incohérente. */
export function AdminPlayerBirthCell({ birthDate, today }: AdminPlayerBirthCellProps) {
  const age = computeAge(birthDate, today);
  return (
    <span className="tabular-nums">
      <time dateTime={birthDate}>{formatDate(birthDate, "short")}</time>
      {age !== null && <span className="text-rpb-ink/72">{` · ${pluralize(age, "an", "ans")}`}</span>}
    </span>
  );
}
