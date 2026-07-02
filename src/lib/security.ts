import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Compara un secreto recibido contra el esperado en tiempo constante.
 *
 * - Devuelve false si el esperado no está configurado (env var faltante):
 *   nunca autorizar contra un secreto vacío/undefined.
 * - Hashea ambos valores antes de comparar para igualar longitudes sin
 *   filtrar información por timing.
 */
export function safeCompareSecret(
  provided: string | null | undefined,
  expected: string | null | undefined
): boolean {
  if (!provided || !expected) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
