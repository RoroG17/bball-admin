import type { LogPosition } from "@/models/LogPosition";
import type { LogSource } from "@/models/LogSource";
import type { LogUser } from "@/models/LogUser";

export type LogContext = Record<string, unknown> | unknown[];

export type ErrorLogEntry = {
  id: number;
  occurredAt: string;
  source: LogSource;
  /** `null` pour la source « client ». */
  statusCode: number | null;
  /** NON FIABLE, non borné. */
  message: string;
  route: string | null;
  /** Valeur brute du back : l'affichage passe par `getDisplayedErrorMethod`. */
  method: string | null;
  user: LogUser | null;
  platform: string | null;
  os: string | null;
  /** NON FIABLE, libre. */
  context: LogContext | null;
  position: LogPosition | null;
};
