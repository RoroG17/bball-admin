"use client";

import { useActionState, useId, useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { createPlayerExam } from "@/actions/examActions";
import { FieldError } from "@/components/ui/FieldError";
import { FormAlert } from "@/components/ui/FormAlert";
import { CheckIcon } from "@/components/ui/icons/CheckIcon";
import { CrossIcon } from "@/components/ui/icons/CrossIcon";
import { TrashIcon } from "@/components/ui/icons/TrashIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ShotLegend } from "@/components/ui/ShotLegend";
import { ShotMarker } from "@/components/ui/ShotMarker";
import { cx } from "@/lib/cx";
import { FIELD_CONTROL_CLASSES } from "@/lib/fieldControlClasses";
import { formatPercentDecimal, formatShootingRatio, pluralize } from "@/lib/format";
import { COURT_HEIGHT, COURT_WIDTH } from "@/lib/halfCourtGeometry";
import { LEGACY_COURT } from "@/models/normalizeShotPosition";
import { classifyShotZone } from "@/models/classifyShotZone";
import { computeShootingPercentage } from "@/models/computeShootingPercentage";
import { MAX_EXAM_SHOTS, type DraftShot } from "@/models/CreateExamInput";
import { SHOT_ZONE_LABELS, SHOT_ZONES } from "@/models/ShotZone";
import { ExamZoneMarker } from "@/views/player-detail/components/ExamZoneMarker";

type ExamCreateFormProps = {
  licence: string;
  today: string;
  /** Lignes du demi-terrain, rendues côté serveur. */
  court: ReactNode;
};

type Outcome = "made" | "missed";

const OUTCOME_LABELS: Record<Outcome, string> = { made: "Réussi", missed: "Manqué" };

export function ExamCreateForm({ licence, today, court }: ExamCreateFormProps) {
  const [state, formAction, pending] = useActionState(createPlayerExam, null);
  const [shots, setShots] = useState<DraftShot[]>([]);
  const [outcome, setOutcome] = useState<Outcome>("made");
  const ids = { date: useId(), shots: useId() };
  const fieldErrors = state?.fieldErrors ?? {};

  const addShot = (event: PointerEvent<SVGSVGElement>) => {
    // Clic principal / toucher : résultat choisi ; clic droit : l'autre résultat (comme dans la V1).
    if (event.button !== 0 && event.button !== 2) return;
    if (shots.length >= MAX_EXAM_SHOTS) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * COURT_WIDTH);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * COURT_HEIGHT);
    const made = event.button === 2 ? outcome !== "made" : outcome === "made";
    setShots((previous) => [...previous, { x, y, made }]);
  };

  const preventMenu = (event: MouseEvent) => event.preventDefault();
  const setMade = (index: number, made: boolean) =>
    setShots((previous) => previous.map((shot, i) => (i === index ? { ...shot, made } : shot)));
  const removeShot = (index: number) => setShots((previous) => previous.filter((_, i) => i !== index));

  const zones = SHOT_ZONES.map((zone) => {
    const inZone = shots.filter((shot) => classifyShotZone(shot) === zone);
    return { zone, made: inZone.filter((shot) => shot.made).length, attempted: inZone.length };
  });

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <input type="hidden" name="licence" value={licence} />
      <input type="hidden" name="shots" value={JSON.stringify(shots)} />
      {state?.message && <FormAlert message={state.message} />}

      <div className="flex max-w-xs flex-col gap-1.5">
        <label htmlFor={ids.date} className="text-sm font-semibold">
          Date de l&apos;examen
        </label>
        <input
          id={ids.date}
          name="date"
          type="date"
          max={today}
          defaultValue={today}
          aria-invalid={fieldErrors.date ? true : undefined}
          aria-describedby={fieldErrors.date ? `${ids.date}-error` : undefined}
          className={FIELD_CONTROL_CLASSES}
        />
        {fieldErrors.date && <FieldError id={`${ids.date}-error`} message={fieldErrors.date} />}
      </div>

      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-3">
        {zones.map(({ zone, made, attempted }) => (
          <li key={zone} className="flex flex-col gap-1 rounded-lg border-2 border-rpb-ink/14 bg-rpb-cream px-3.5 py-3">
            <span className="flex items-center gap-2 text-xs font-semibold tracking-[.08em] uppercase text-rpb-bordeaux">
              <ExamZoneMarker zone={zone} size={14} className="shrink-0" />
              {SHOT_ZONE_LABELS[zone]}
            </span>
            <span className="font-display text-2xl font-extrabold tabular-nums">
              {attempted > 0 ? formatShootingRatio(made, attempted) : "—"}
            </span>
            <span className="text-sm text-rpb-ink/72 tabular-nums">
              {attempted > 0 ? formatPercentDecimal(computeShootingPercentage(made, attempted), 0) : "Aucun tir"}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="radiogroup" aria-label="Résultat du prochain tir" className="flex gap-2">
            {(["made", "missed"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={outcome === option}
                onClick={() => setOutcome(option)}
                className={cx(
                  "inline-flex min-h-11 items-center gap-2 rounded-lg border-2 px-4 text-sm font-bold focus-ring",
                  outcome === option
                    ? "border-rpb-ink bg-rpb-gold text-rpb-ink"
                    : "border-rpb-ink/14 bg-rpb-cream hover:bg-rpb-gold-light",
                )}
              >
                {option === "made" ? <CheckIcon size={16} strokeWidth={2.8} /> : <CrossIcon size={16} strokeWidth={2.8} />}
                {OUTCOME_LABELS[option]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <PrimaryButton variant="outline" onClick={() => setShots((previous) => previous.slice(0, -1))} disabled={shots.length === 0}>
              Annuler le dernier tir
            </PrimaryButton>
            <PrimaryButton variant="outline" onClick={() => setShots([])} disabled={shots.length === 0}>
              Tout effacer
            </PrimaryButton>
          </div>
        </div>
        <p id={`${ids.shots}-help`} className="text-[13px]/[18px] text-rpb-ink/72">
          Touche ou clique sur le terrain à l&apos;endroit du tir : il prend le résultat sélectionné. Le clic droit
          pose le résultat inverse. La zone est calculée automatiquement.
        </p>
        <div className="max-w-[800px]">
          <svg
            viewBox={`0 0 ${COURT_WIDTH} ${COURT_HEIGHT}`}
            role="img"
            aria-label={`Demi-terrain : ${pluralize(shots.length, "tir placé", "tirs placés")}`}
            aria-describedby={`${ids.shots}-help`}
            className="block h-auto w-full cursor-crosshair touch-manipulation rounded-md border-2 border-rpb-ink select-none"
            onPointerDown={addShot}
            onContextMenu={preventMenu}
          >
            {court}
            {shots.map((shot, index) => (
              <ShotMarker key={index} shot={{ made: shot.made, position: { x: shot.x / COURT_WIDTH, y: shot.y / COURT_HEIGHT } }} index={0} />
            ))}
          </svg>
        </div>
        <ShotLegend />
        {fieldErrors.shots && <FieldError id={`${ids.shots}-error`} message={fieldErrors.shots} />}
      </div>

      {shots.length > 0 && (
        <section aria-labelledby={`${ids.shots}-title`} className="flex flex-col gap-3">
          <h2 id={`${ids.shots}-title`} className="font-display text-xl font-extrabold">
            Tirs enregistrés ({shots.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-rpb-ink text-left text-xs font-semibold tracking-[.08em] uppercase text-rpb-bordeaux">
                  <th scope="col" className="px-2 py-2">N°</th>
                  <th scope="col" className="px-2 py-2 text-right">X</th>
                  <th scope="col" className="px-2 py-2 text-right">Y</th>
                  <th scope="col" className="px-2 py-2">Zone</th>
                  <th scope="col" className="px-2 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shots.map((shot, index) => {
                  const zone = classifyShotZone(shot);
                  return (
                    <tr key={index} className="border-b border-rpb-ink/14">
                      <th scope="row" className="px-2 py-1.5 text-left font-bold tabular-nums">{index + 1}</th>
                      <td className="px-2 py-1.5 text-right tabular-nums">{shot.x + LEGACY_COURT.originX}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{shot.y + LEGACY_COURT.originY}</td>
                      <td className="px-2 py-1.5 font-semibold">
                        <span className="flex items-center gap-2">
                          <ExamZoneMarker zone={zone} size={16} className="shrink-0" />
                          {SHOT_ZONE_LABELS[zone]}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="flex justify-end gap-1.5">
                          {([true, false] as const).map((made) => (
                            <button
                              key={String(made)}
                              type="button"
                              aria-pressed={shot.made === made}
                              aria-label={`Tir ${index + 1} : ${made ? "réussi" : "manqué"}`}
                              onClick={() => setMade(index, made)}
                              className={cx(
                                "inline-flex size-11 items-center justify-center rounded-lg border-2 focus-ring",
                                shot.made === made
                                  ? "border-rpb-ink bg-rpb-gold"
                                  : "border-rpb-ink/14 bg-rpb-cream hover:bg-rpb-gold-light",
                              )}
                            >
                              {made ? <CheckIcon size={18} strokeWidth={2.8} /> : <CrossIcon size={18} strokeWidth={2.8} />}
                            </button>
                          ))}
                          <button
                            type="button"
                            aria-label={`Supprimer le tir ${index + 1}`}
                            onClick={() => removeShot(index)}
                            className="inline-flex size-11 items-center justify-center rounded-lg border-2 border-rpb-ink/14 bg-rpb-cream text-danger focus-ring hover:bg-rpb-gold-light"
                          >
                            <TrashIcon size={18} />
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="flex flex-wrap justify-end gap-2.5 border-t-2 border-rpb-ink/14 pt-4">
        <PrimaryButton href={`/player/${encodeURIComponent(licence)}?onglet=examens`} variant="outline">
          Annuler
        </PrimaryButton>
        <PrimaryButton type="submit" busy={pending}>
          {pending ? "Enregistrement…" : "Enregistrer l'examen"}
        </PrimaryButton>
      </div>
    </form>
  );
}
