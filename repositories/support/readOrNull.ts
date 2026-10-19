import "server-only";
import { unstable_rethrow } from "next/navigation";

/**
 * Dégrade une lecture secondaire en `null` sans masquer le bloc principal. `redirect()` (session expirée), `notFound()`
 * et `forbidden()` sont relancés. `countOrNull` = `readOrNull<number | null>`.
 */
export async function readOrNull<T>(call: () => Promise<T>): Promise<T | null> {
  try {
    return await call();
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}
