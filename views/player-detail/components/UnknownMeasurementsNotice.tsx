import { SummaryNotice } from "@/components/ui/SummaryNotice";

type UnknownMeasurementsNoticeProps = {
  entries: { rawType: string; count: number }[];
};

/** Visible des admins seulement : des mesures de type non reconnu ne sont jamais affichées comme une autre (P6). */
export function UnknownMeasurementsNotice({ entries }: UnknownMeasurementsNoticeProps) {
  if (entries.length === 0) return null;
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);
  const types = entries.map((entry) => `« ${entry.rawType} »`).join(", ");
  const message =
    total > 1
      ? `${total} mesures d'un type non reconnu (${types}) ne sont pas affichées.`
      : `1 mesure d'un type non reconnu (${types}) n'est pas affichée.`;

  return <SummaryNotice tone="light" message={message} />;
}
