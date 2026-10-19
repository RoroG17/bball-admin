import { SummaryNotice } from "@/components/ui/SummaryNotice";
import { GAME_MESSAGES } from "@/models/adminGameMessages";

type GameStatsNoticeProps = { statLineCount: number | null };

/** Mention de l'écran de modification : le match a des statistiques (ou leur nombre est inconnu). Rien s'il n'en a pas. */
export function GameStatsNotice({ statLineCount }: GameStatsNoticeProps) {
  if (statLineCount === 0) return null;
  return (
    <SummaryNotice
      tone="light"
      icon="alert"
      message={statLineCount === null ? GAME_MESSAGES.statsUnknown : GAME_MESSAGES.statsNotice(statLineCount)}
    />
  );
}
