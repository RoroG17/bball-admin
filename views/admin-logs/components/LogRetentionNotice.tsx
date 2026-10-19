import { SummaryNotice } from "@/components/ui/SummaryNotice";
import { describeLogRetention } from "@/models/logRetention";

/** Rappel permanent de la durée de conservation (P11). */
export function LogRetentionNotice() {
  return <SummaryNotice tone="light" message={describeLogRetention()} />;
}
