import { Card } from "@/components/ui/Card";
import { InfoIcon } from "@/components/ui/icons/InfoIcon";
import { animationDelay } from "@/lib/animationDelay";
import type { CalendarGame } from "@/models/CalendarGame";
import { describeGameVideo } from "@/models/describeGameVideo";
import type { GameVideo } from "@/models/GameVideo";
import { YouTubePlayer } from "@/views/game-detail/components/YouTubePlayer";

type GameVideoSectionProps = { video: GameVideo; overview: CalendarGame };

const DELAY_MS = 220;

/** Vidéo seulement si elle est valide (P4). Rien pour un match à venir, un bandeau discret sinon. */
export function GameVideoSection({ video, overview }: GameVideoSectionProps) {
  if (video.kind === "youtube") {
    return (
      <Card title="Vidéo du match" animation="reveal" delayMs={DELAY_MS}>
        <YouTubePlayer videoId={video.videoId} title={describeGameVideo(overview)} />
      </Card>
    );
  }
  if (overview.status === "upcoming") return null;

  return (
    <section
      aria-label="Vidéo du match"
      className="reveal flex items-center gap-2.5 rounded-lg border-2 border-rpb-ink/14 px-4 py-3 text-sm text-rpb-ink/72"
      style={animationDelay(DELAY_MS)}
    >
      <InfoIcon size={18} className="shrink-0" />
      Vidéo non disponible pour ce match.
    </section>
  );
}
