"use server";

import { redirect } from "next/navigation";
import { AUTH_MESSAGES } from "@/models/authMessages";
import { buildLoginHref } from "@/models/buildLoginHref";
import { createInitPasswordSchema, type InitPasswordField } from "@/models/InitPasswordInput";
import type { InitPasswordState } from "@/models/InitPasswordState";
import { LoginInputSchema } from "@/models/LoginInput";
import type { LoginState } from "@/models/LoginState";
import { sanitizeRedirectPath } from "@/models/sanitizeRedirectPath";
import { endActivation, getPendingActivation, startActivation } from "@/repositories/ActivationRepository";
import { authenticate, setPassword } from "@/repositories/AuthRepository";
import { createSession, destroySession } from "@/repositories/SessionRepository";

const readField = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

/** `/init-password`, avec la page de retour si elle n'est pas l'accueil. */
const buildInitPasswordHref = (redirectTo: string) =>
  redirectTo === "/" ? "/init-password" : `/init-password?${new URLSearchParams({ redirect: redirectTo })}`;

/**
 * Connexion. Mot de passe vide = première connexion possible (D2) : si le back répond « mot de passe à initialiser »,
 * l'identifiant part dans un cookie d'activation signé, jamais dans l'URL. Un échec réseau ne touche pas la session
 * existante (P6). Les redirections sont hors de tout `try`.
 */
export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const username = readField(formData, "username");
  const redirectTo = sanitizeRedirectPath(readField(formData, "redirect"));

  const parsed = LoginInputSchema.safeParse({ username, password: readField(formData, "password") });
  if (!parsed.success) {
    return {
      status: "error",
      reason: "invalidInput",
      message: AUTH_MESSAGES.invalidInput,
      fieldErrors: { username: AUTH_MESSAGES.invalidInput },
      values: { username },
    };
  }

  const result = await authenticate(parsed.data.username, parsed.data.password);
  switch (result.kind) {
    case "authenticated":
      await createSession(result.user, result.token);
      await endActivation();
      redirect(redirectTo);
    case "passwordNotSet":
      await startActivation(parsed.data.username);
      redirect(buildInitPasswordHref(redirectTo));
    case "invalidCredentials":
    case "tooManyAttempts":
    case "unavailable":
      return {
        status: "error",
        reason: result.kind,
        message: AUTH_MESSAGES[result.kind],
        fieldErrors: {},
        values: { username },
      };
  }
}

/**
 * Création du mot de passe d'un compte qui n'en a pas (D2). L'identifiant vient UNIQUEMENT du cookie d'activation
 * signé ; un champ `username` envoyé par le formulaire est ignoré (P2). Le compte est recontrôlé juste avant
 * l'écriture : un compte qui a déjà un mot de passe n'est jamais écrasé par cet écran. Puis connexion automatique (D3).
 */
export async function initPassword(_previous: InitPasswordState, formData: FormData): Promise<InitPasswordState> {
  const redirectTo = sanitizeRedirectPath(readField(formData, "redirect"));

  const activation = await getPendingActivation();
  if (!activation) redirect(buildLoginHref({ redirect: redirectTo, reason: "activation-expired" }));

  const parsed = createInitPasswordSchema(activation.username).safeParse({
    password: readField(formData, "password"),
    confirmation: readField(formData, "confirmation"),
  });
  if (!parsed.success) {
    const fieldErrors: Partial<Record<InitPasswordField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "password" || field === "confirmation") fieldErrors[field] ??= issue.message;
    }
    return { status: "error", message: null, fieldErrors };
  }

  // Recontrôle : le compte est-il toujours sans mot de passe ? (400 = déjà défini, 404 = supprimé)
  const check = await authenticate(activation.username);
  if (check.kind === "tooManyAttempts" || check.kind === "unavailable") {
    return { status: "error", message: AUTH_MESSAGES.initPasswordUnavailable, fieldErrors: {} };
  }
  if (check.kind !== "passwordNotSet") {
    await endActivation();
    redirect(buildLoginHref({ redirect: redirectTo, reason: "already-active" }));
  }

  const update = await setPassword(activation.username, parsed.data.password);
  switch (update.kind) {
    case "ok":
      break;
    case "notFound":
      await endActivation();
      redirect(buildLoginHref({ redirect: redirectTo, reason: "activation-expired" }));
    case "invalid":
      return { status: "error", message: update.message ?? AUTH_MESSAGES.initPasswordFailed, fieldErrors: {} };
    case "tooManyAttempts":
    case "unavailable":
      return { status: "error", message: AUTH_MESSAGES.initPasswordUnavailable, fieldErrors: {} };
  }

  await endActivation();
  const session = await authenticate(activation.username, parsed.data.password);
  if (session.kind !== "authenticated") redirect(buildLoginHref({ redirect: redirectTo, reason: "password-set" }));
  await createSession(session.user, session.token);
  redirect(redirectTo);
}

/**
 * Déconnexion : supprime la session et toute activation, sans vérifier la session (une session déjà expirée doit
 * pouvoir se déconnecter). Le jeton Sanctum n'est pas révoqué : le back n'a pas de route de déconnexion (B4).
 */
export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
