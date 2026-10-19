"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { addPhysicalMeasurement } from "@/actions/physicalMeasurementActions";
import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";
import { ChevronDownIcon } from "@/components/ui/icons/ChevronDownIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { cx } from "@/lib/cx";
import type { AddMeasurementField, AddMeasurementState } from "@/models/AddMeasurementState";
import { describeMeasurementRange } from "@/models/describeMeasurementRange";
import {
  MEASUREMENT_LABELS,
  MEASUREMENT_TYPES,
  MEASUREMENT_UNITS,
  type MeasurementType,
} from "@/models/MeasurementType";

type AddMeasurementFormProps = {
  licence: string;
  today: string;
  /** Appelé une fois, quand la mesure est enregistrée. */
  onSuccess: () => void;
  onCancel: () => void;
};

const IDLE: AddMeasurementState = { status: "idle" };
const CONTROL =
  "min-h-12 w-full appearance-none rounded-lg border-2 border-rpb-ink bg-rpb-cream px-3.5 text-base font-medium text-rpb-ink tabular-nums focus-ring aria-invalid:border-danger";
const FIELD_ORDER: AddMeasurementField[] = ["date", "type", "value"];

const isMeasurementType = (value: string): value is MeasurementType =>
  (MEASUREMENT_TYPES as readonly string[]).includes(value);

export function AddMeasurementForm({ licence, today, onSuccess, onCancel }: AddMeasurementFormProps) {
  const [state, formAction, pending] = useActionState(addPhysicalMeasurement, IDLE);
  const ids = { date: useId(), type: useId(), value: useId() };
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState("");
  const errors = state.status === "error" ? state.fieldErrors : {};
  const values = state.status === "error" ? state.values : { date: "", type: "", value: "" };
  const selectedType = isMeasurementType(type) ? type : null;

  useEffect(() => {
    if (state.status === "success") onSuccess();
    // Au retour en erreur, le focus va sur le premier champ invalide.
    if (state.status === "error") {
      const first = FIELD_ORDER.find((field) => state.fieldErrors[field]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    }
  }, [state, onSuccess]);

  const describedBy = (field: AddMeasurementField, withHelp = false) =>
    [withHelp ? `${ids[field]}-help` : null, errors[field] ? `${ids[field]}-error` : null].filter(Boolean).join(" ") ||
    undefined;

  const fieldError = (field: AddMeasurementField) =>
    errors[field] && (
      <p id={`${ids[field]}-error`} className="flex items-start gap-1.5 text-sm font-semibold text-danger">
        <AlertTriangleIcon size={16} strokeWidth={2.2} className="mt-0.5 shrink-0" />
        {errors[field]}
      </p>
    );

  return (
    <form ref={formRef} action={formAction} noValidate>
      <div className="flex flex-col gap-4 p-5">
        {state.status === "error" && state.message && (
          <div role="alert" className="shake flex items-start gap-2.5 rounded-md border-2 border-danger px-3.5 py-2.5 text-sm">
            <AlertTriangleIcon size={18} className="shrink-0 text-danger" />
            <p className="font-semibold text-danger">{state.message}</p>
          </div>
        )}
        <input type="hidden" name="licence" value={licence} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.date} className="text-sm font-semibold">
            Date de la mesure
          </label>
          <input
            key={`date-${values.date}`}
            id={ids.date}
            name="date"
            type="date"
            max={today}
            defaultValue={values.date}
            aria-invalid={errors.date ? true : undefined}
            aria-describedby={describedBy("date")}
            className={CONTROL}
          />
          {fieldError("date")}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.type} className="text-sm font-semibold">
            Mesure
          </label>
          <div className="relative">
            <select
              id={ids.type}
              key={`type-${values.type}`}
              name="type"
              defaultValue={values.type}
              onChange={(event) => setType(event.target.value)}
              aria-invalid={errors.type ? true : undefined}
              aria-describedby={describedBy("type")}
              className={cx(CONTROL, "pr-10")}
            >
              <option value="">Choisis une mesure</option>
              {MEASUREMENT_TYPES.map((option) => (
                <option key={option} value={option}>
                  {MEASUREMENT_LABELS[option]} ({MEASUREMENT_UNITS[option]})
                </option>
              ))}
            </select>
            <ChevronDownIcon size={18} strokeWidth={2.5} className="pointer-events-none absolute top-[15px] right-3.5" />
          </div>
          {fieldError("type")}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.value} className="text-sm font-semibold">
            Valeur
          </label>
          <div className="relative">
            <input
              key={`value-${values.value}`}
              id={ids.value}
              name="value"
              inputMode="decimal"
              autoComplete="off"
              defaultValue={values.value}
              aria-invalid={errors.value ? true : undefined}
              aria-describedby={describedBy("value", true)}
              className={cx(CONTROL, "pr-16")}
            />
            {selectedType && (
              <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[15px] font-semibold text-rpb-ink/72">
                {MEASUREMENT_UNITS[selectedType]}
              </span>
            )}
          </div>
          <p id={`${ids.value}-help`} className="text-[13px]/[18px] text-rpb-ink/72">
            {selectedType ? describeMeasurementRange(selectedType) : "Choisis d'abord une mesure."}
          </p>
          {fieldError("value")}
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2.5 border-t-2 border-rpb-ink/14 px-5 py-4">
        <PrimaryButton variant="outline" type="button" onClick={onCancel}>
          Annuler
        </PrimaryButton>
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </PrimaryButton>
      </div>
    </form>
  );
}
