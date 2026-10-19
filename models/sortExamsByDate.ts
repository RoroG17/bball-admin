import type { Exam } from "@/models/Exam";

/** Par date, puis par identifiant (même sens). Ne mute pas l'entrée (P14). */
export function sortExamsByDate(exams: readonly Exam[], direction: "asc" | "desc"): Exam[] {
  const sign = direction === "asc" ? 1 : -1;
  return [...exams].sort((a, b) => sign * (a.date === b.date ? a.id - b.id : a.date < b.date ? -1 : 1));
}
