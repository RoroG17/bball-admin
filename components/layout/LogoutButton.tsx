import { logout } from "@/actions/authActions";
import { LogOutIcon } from "@/components/ui/icons/LogOutIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

/** Toujours visible dans l'en-tête (tablette partagée, DS80). Formulaire sans JS client : appelle l'action. */
export function LogoutButton() {
  return (
    <form action={logout} className="m-0">
      <PrimaryButton variant="gold" size="tall" type="submit">
        <LogOutIcon size={20} strokeWidth={2.2} className="shrink-0" />
        Déconnexion
      </PrimaryButton>
    </form>
  );
}
