import "server-only";
import { unstable_rethrow } from "next/navigation";
import { ApiError } from "@/lib/ApiError";
import { apiPost } from "@/lib/http";
import { classifyShotZone } from "@/models/classifyShotZone";
import type { CreateExamInput } from "@/models/CreateExamInput";
import type { Exam } from "@/models/Exam";
import { sortExamsByDate } from "@/models/sortExamsByDate";
import { ExamCountSliceDto, ExamsSliceDto } from "@/repositories/dto/ExamDto";
import { ValidationErrorDto } from "@/repositories/dto/ValidationErrorDto";
import { fetchPlayerDetailPayload } from "@/repositories/sources/playerDetailSource";

/** Examens du joueur, du plus récent au plus ancien (P14). À n'appeler que si le lecteur y a droit. Format invalide → erreur (onglet seul). */
export async function listPlayerExams(licence: string): Promise<Exam[]> {
  const payload = await fetchPlayerDetailPayload(licence);
  if (payload === null) return [];
  return sortExamsByDate(ExamsSliceDto.parse(payload).examens, "desc");
}

/** Nombre d'examens sans valider leur contenu. Ne lève pas : `null` si inconnu. */
export async function countPlayerExams(licence: string): Promise<number | null> {
  const payload = await fetchPlayerDetailPayload(licence);
  if (payload === null) return null;
  const result = ExamCountSliceDto.safeParse(payload);
  return result.success ? result.data.examens.length : null;
}

export type CreateExamResult =
  | { kind: "ok" }
  | { kind: "invalid"; errors: Record<string, string[]> }
  | { kind: "notFound" }
  | { kind: "failed" };

/** Le back garde les coordonnées du dessin V1 (terrain à partir de (25, 25)) et les zones « Paint » / « Mid-Range » / « 3-Point ». */
const BACK_ZONES = { paint: "Paint", midRange: "Mid-Range", threePoint: "3-Point" } as const;
const BACK_COURT_OFFSET = 25;

/**
 * `POST /api/examens`. Ne lève jamais : toute erreur devient un résultat typé. Ne journalise rien du payload.
 * La zone est calculée ici, jamais lue du client.
 */
export async function createExam(input: CreateExamInput, token: string): Promise<CreateExamResult> {
  try {
    await apiPost(
      "/api/examens",
      {
        date: input.date,
        licence: input.licence,
        shoot: input.shots.map((shot, index) => ({
          id: index + 1,
          x: shot.x + BACK_COURT_OFFSET,
          y: shot.y + BACK_COURT_OFFSET,
          made: shot.made,
          type: BACK_ZONES[classifyShotZone(shot)],
        })),
      },
      { token },
    );
    return { kind: "ok" };
  } catch (error) {
    // Laisse passer `redirect()` (session expirée, 401) : sinon il serait avalé ici.
    unstable_rethrow(error);
    if (error instanceof ApiError && error.status === 422) {
      const body = ValidationErrorDto.safeParse(error.body);
      if (body.success) return { kind: "invalid", errors: body.data.errors };
    }
    return { kind: "failed" };
  }
}
