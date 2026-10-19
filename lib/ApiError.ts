export class ApiError extends Error {
  readonly status: number;
  readonly path: string;
  /** Corps JSON de la réponse d'erreur s'il existe (erreurs de validation 422). */
  readonly body: unknown;

  constructor(status: number, path: string, body?: unknown) {
    super(`L'API a répondu ${status} sur ${path}`);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
    this.body = body;
  }
}
