import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";
import { animationDelay } from "@/lib/animationDelay";
import type { AdminGameAlert } from "@/models/AdminGameAlert";
import { describeAdminGameAlert } from "@/models/describeAdminGameAlert";

type AdminGameAlertsProps = { alerts: AdminGameAlert[] };

/** Points à vérifier, visibles par l'admin seulement (P3, P7). Icône + texte, jamais la couleur seule. */
export function AdminGameAlerts({ alerts }: AdminGameAlertsProps) {
  if (alerts.length === 0) return null;

  return (
    <section
      aria-label="Alertes administrateur"
      className="reveal flex flex-col gap-2.5 rounded-lg border-2 border-rpb-ink bg-rpb-gold-light px-4 py-3.5"
      style={animationDelay(260)}
    >
      <p className="text-xs font-semibold tracking-[.08em] text-rpb-bordeaux uppercase">
        À vérifier · visible par les admins uniquement
      </p>
      <ul className="flex flex-col gap-2">
        {alerts.map((alert) => (
          <li key={alert.kind} className="flex items-start gap-2.5 text-sm">
            <AlertTriangleIcon size={18} className="mt-px shrink-0 text-rpb-ink" />
            <span>{describeAdminGameAlert(alert)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
