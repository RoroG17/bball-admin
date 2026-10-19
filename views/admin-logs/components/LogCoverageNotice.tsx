import { SummaryNotice } from "@/components/ui/SummaryNotice";
import { LOG_MESSAGES } from "@/models/logMessages";

/** Rappel permanent de ce que le journal ne montre pas (appels hors API, pages du cache) et de l'IP du serveur. */
export function LogCoverageNotice() {
  return <SummaryNotice tone="light" message={LOG_MESSAGES.coverage} />;
}
