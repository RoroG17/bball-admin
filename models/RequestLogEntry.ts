import type { LogPosition } from "@/models/LogPosition";
import type { LogUser } from "@/models/LogUser";

export type RequestLogEntry = {
  id: number;
  /** ISO 8601 UTC (« …Z ») : seul format interne ; le fuseau n'est appliqué qu'à l'affichage. */
  occurredAt: string;
  method: string;
  /** Chemin RÉEL (`/api/joueurs/AB123456`), sans query string. */
  route: string;
  statusCode: number;
  /** Inclut l'envoi de la réponse. */
  durationMs: number;
  user: LogUser | null;
  platform: string | null;
  os: string | null;
  /** « Adresse vue par l'API » : pour la V2, celle du serveur de l'application. */
  ipAddress: string | null;
  position: LogPosition | null;
};
