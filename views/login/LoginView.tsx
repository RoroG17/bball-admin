import { redirect } from "next/navigation";
import { AuthShell } from "@/components/layout/AuthShell";
import { parseLoginReason } from "@/models/parseLoginReason";
import { sanitizeRedirectPath } from "@/models/sanitizeRedirectPath";
import { getCurrentSession } from "@/repositories/SessionRepository";
import { LoginForm } from "@/views/login/components/LoginForm";
import { LoginNotice } from "@/views/login/components/LoginNotice";

type LoginViewProps = {
  requestedRedirect?: string;
  requestedReason?: string;
};

/** Connexion. Déjà connecté : renvoyé vers la page demandée (assainie), sinon l'accueil (D8). */
export async function LoginView({ requestedRedirect, requestedReason }: LoginViewProps) {
  const redirectTo = sanitizeRedirectPath(requestedRedirect);
  if (await getCurrentSession()) redirect(redirectTo);
  const reason = parseLoginReason(requestedReason);

  return (
    <AuthShell title="Connexion" lead="Entre ton identifiant pour accéder aux statistiques du club.">
      {reason && <LoginNotice reason={reason} />}
      <LoginForm redirectTo={redirectTo} />
    </AuthShell>
  );
}
