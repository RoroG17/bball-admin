import { formatDateTime } from "@/lib/format";
import { LOG_MESSAGES } from "@/models/logMessages";

type LogTimestampProps = {
  isoUtc: string;
  /** Détail : date sur une ligne, précédée de la précision « Heure de Paris · UTC : … ». */
  showUtc?: boolean;
};

/** Horodatage en heure de Paris (secondes comprises) ; en liste, le jour au-dessus de l'heure. */
export function LogTimestamp({ isoUtc, showUtc = false }: LogTimestampProps) {
  const paris = formatDateTime(isoUtc, "Europe/Paris");
  if (paris === "—") return <span>—</span>;
  if (showUtc) {
    return (
      <>
        <time dateTime={isoUtc} className="tabular-nums">
          {paris}
        </time>
        <small className="block text-[13px]/5 font-normal text-rpb-ink/72">
          {LOG_MESSAGES.parisTime} · UTC : {formatDateTime(isoUtc, "UTC")}
        </small>
      </>
    );
  }
  const [day, time] = paris.split(" ");
  return (
    <time dateTime={isoUtc} className="block whitespace-nowrap tabular-nums">
      <span className="block text-[13px]/[18px] text-rpb-ink/72">{day}</span>
      <span className="block text-sm/5 font-semibold">{time}</span>
      <span className="sr-only"> ({LOG_MESSAGES.parisTime.toLowerCase()})</span>
    </time>
  );
}
