/** État de l'action `login`. Ne contient jamais le mot de passe ; le succès n'a pas d'état (redirection). */
export type LoginState =
  | { status: "idle" }
  | {
      status: "error";
      reason: "invalidInput" | "invalidCredentials" | "tooManyAttempts" | "unavailable";
      message: string;
      fieldErrors: Partial<Record<"username", string>>;
      values: { username: string };
    };
