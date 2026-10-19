import { SummaryNotice } from "@/components/ui/SummaryNotice";
import { LOGIN_REASON_MESSAGES, type LoginReason } from "@/models/LoginReason";

type LoginNoticeProps = { reason: LoginReason };

/** Information au-dessus du formulaire (session expirée, mot de passe défini…). Pas une erreur. */
export function LoginNotice({ reason }: LoginNoticeProps) {
  return (
    <div role="status" className="reveal" style={{ animationDelay: "120ms" }}>
      <SummaryNotice
        tone="light"
        icon={reason === "password-set" ? "check" : "info"}
        message={LOGIN_REASON_MESSAGES[reason]}
      />
    </div>
  );
}
