import { ROLE_PERMISSIONS, type Permission } from "@/models/Permission";
import type { Session } from "@/models/Session";

export function hasPermission(session: Pick<Session, "role"> | null, permission: Permission): boolean {
  if (!session) return false;
  return ROLE_PERMISSIONS[session.role].includes(permission);
}
