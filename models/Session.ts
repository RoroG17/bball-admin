import { z } from "zod";

export const UserRoleSchema = z.enum(["admin", "player"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const SessionSchema = z.object({
  username: z.string().min(1),
  licence: z.string().min(1).nullable(),
  role: UserRoleSchema,
  /** Token Sanctum, transmis au back en Bearer. */
  token: z.string().min(1),
});

export type Session = z.infer<typeof SessionSchema>;
