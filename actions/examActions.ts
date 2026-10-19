"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildPlayerHref } from "@/models/buildPlayerHref";
import { createCreateExamSchema, type CreateExamState } from "@/models/CreateExamInput";
import { getParisIsoDate } from "@/models/getParisIsoDate";
import { hasPermission } from "@/models/hasPermission";
import { createExam } from "@/repositories/ExamRepository";
import { getCurrentSession } from "@/repositories/SessionRepository";

const NETWORK_FAILURE = "Échec de l'enregistrement. Vérifie ta connexion puis réessaie.";
const PLAYER_GONE = "Ce joueur n'existe plus.";

type FieldErrors = NonNullable<CreateExamState>["fieldErrors"];

const readField = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

const parseShots = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

/**
 * Création d'un examen de tir (admin). Joignable par un POST direct : le rôle est TOUJOURS relu dans la session signée.
 * Les tirs arrivent en JSON dans le champ `shots` ; la zone de chaque tir est recalculée côté serveur. En cas de succès,
 * retour sur l'onglet Examens de la fiche.
 */
export async function createPlayerExam(_previous: CreateExamState, formData: FormData): Promise<CreateExamState> {
  const session = await getCurrentSession();
  if (!session || !hasPermission(session, "managePlayerData")) {
    return { message: "Action réservée aux administrateurs.", fieldErrors: {} };
  }

  const parsed = createCreateExamSchema(getParisIsoDate(new Date())).safeParse({
    licence: readField(formData, "licence"),
    date: readField(formData, "date"),
    shots: parseShots(readField(formData, "shots")),
  });
  if (!parsed.success) {
    const fieldErrors: FieldErrors = {};
    let message: string | null = null;
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "date") fieldErrors.date ??= issue.message;
      else if (key === "shots") {
        // Un tir précis invalide (hors terrain) : message générique sur la zone de saisie.
        fieldErrors.shots ??= issue.path.length > 1 ? "Un des tirs est invalide : retire-le et replace-le." : issue.message;
      } else message ??= issue.message;
    }
    return { message, fieldErrors };
  }

  const result = await createExam(parsed.data, session.token);
  switch (result.kind) {
    case "ok":
      revalidatePath(`/player/${encodeURIComponent(parsed.data.licence)}`);
      redirect(buildPlayerHref(parsed.data.licence, { onglet: "exams" }));
    case "notFound":
      return { message: PLAYER_GONE, fieldErrors: {} };
    case "invalid": {
      const fieldErrors: FieldErrors = {};
      let message: string | null = null;
      for (const [field, messages] of Object.entries(result.errors)) {
        if (field === "date") fieldErrors.date ??= messages[0];
        else if (field === "licence") message = PLAYER_GONE;
        else message ??= messages[0] ?? NETWORK_FAILURE;
      }
      return { message, fieldErrors };
    }
    case "failed":
      return { message: NETWORK_FAILURE, fieldErrors: {} };
  }
}
