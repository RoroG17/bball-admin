import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { buildHallOfFameHref } from "@/models/buildHallOfFameHref";
import { formatHallOfFameModeParam } from "@/models/formatHallOfFameModeParam";
import { HALL_OF_FAME_MODES, type HallOfFameMode } from "@/models/HallOfFameMode";
import { parseHallOfFameMode } from "@/models/parseHallOfFameMode";
import { hasHallOfFameRecords } from "@/repositories/HallOfFameRepository";
import { requireSession } from "@/repositories/SessionRepository";
import { HallOfFameEmptyState } from "@/views/hall-of-fame/components/HallOfFameEmptyState";
import { HallOfFameHeader } from "@/views/hall-of-fame/components/HallOfFameHeader";
import { HallOfFameModePanel } from "@/views/hall-of-fame/components/HallOfFameModePanel";
import { HallOfFameModeTabs } from "@/views/hall-of-fame/components/HallOfFameModeTabs";

type HallOfFameViewProps = {
  /** Valeur brute du paramètre `?mode=`, non validée. */
  requestedMode: string | undefined;
};

const MAIN_CLASSES = "anim mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16";

export async function HallOfFameView({ requestedMode }: HallOfFameViewProps) {
  await requireSession();

  // L'URL reflète toujours le mode affiché : paramètre invalide, mal orthographié ou redondant → forme canonique.
  const mode = parseHallOfFameMode(requestedMode);
  if ((requestedMode ?? null) !== formatHallOfFameModeParam(mode)) redirect(buildHallOfFameHref(mode));

  // Lève en cas de panne globale (réseau, 5xx, forme générale) : `error.tsx` prend le relais.
  if (!(await hasHallOfFameRecords())) {
    return (
      <main className={MAIN_CLASSES}>
        <HallOfFameHeader />
        <HallOfFameEmptyState />
      </main>
    );
  }

  const panels = Object.fromEntries(
    HALL_OF_FAME_MODES.map((panelMode) => [panelMode, <HallOfFameModePanel key={panelMode} mode={panelMode} />]),
  ) as Record<HallOfFameMode, ReactNode>;

  return (
    <main className={MAIN_CLASSES}>
      <HallOfFameHeader />
      <HallOfFameModeTabs panels={panels} />
    </main>
  );
}
