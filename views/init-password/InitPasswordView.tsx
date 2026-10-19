import { redirect } from "next/navigation";
import { AuthShell } from "@/components/layout/AuthShell";
import { buildLoginHref } from "@/models/buildLoginHref";
import { sanitizeRedirectPath } from "@/models/sanitizeRedirectPath";
import { getPendingActivation } from "@/repositories/ActivationRepository";
import { getCurrentSession } from "@/repositories/SessionRepository";
import { InitPasswordForm } from "@/views/init-password/components/InitPasswordForm";

type InitPasswordViewProps = { requestedRedirect?: string };

/**
 * Création du mot de passe à la première connexion. Accessible seulement avec un cookie d'activation posé par la
 * connexion : `/init-password?username=…` ouvert directement ne mène à rien (P2).
 */
export async function InitPasswordView({ requestedRedirect }: InitPasswordViewProps) {
  const redirectTo = sanitizeRedirectPath(requestedRedirect);
  if (await getCurrentSession()) redirect(redirectTo);
  const activation = await getPendingActivation();
  if (!activation) redirect(buildLoginHref({ redirect: redirectTo, reason: "activation-expired" }));

  return (
    <AuthShell
      title="Créer ton mot de passe"
      lead="C'est ta première connexion : choisis un mot de passe pour sécuriser ton compte."
    >
      <InitPasswordForm username={activation.username} redirectTo={redirectTo} />
    </AuthShell>
  );
}
