import { CheckIcon } from "@/components/ui/icons/CheckIcon";
import { CrossIcon } from "@/components/ui/icons/CrossIcon";
import { EqualIcon } from "@/components/ui/icons/EqualIcon";
import type { GameOutcome } from "@/models/GameOutcome";

type OutcomeIconProps = { outcome: GameOutcome };

export function OutcomeIcon({ outcome }: OutcomeIconProps) {
  if (outcome === "win") return <CheckIcon size={13} />;
  if (outcome === "loss") return <CrossIcon size={13} />;
  if (outcome === "draw") return <EqualIcon size={13} />;
  return null;
}
