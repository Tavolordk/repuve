/**
 * Mensajes estandarizados para los errores HTTP que devuelven los endpoints
 * del flujo de autenticación / activación / generar contraseña / renovar
 * cuenta (/iniciar, /enviarCodigo, /verificarCodigo, /iniciarFlujoActivacion).
 *
 * La idea es centralizar la traducción status-HTTP → mensaje de UI para que
 * todas las pantallas (login-page, account-activation-page, etc.) muestren
 * exactamente el mismo texto ante el mismo error del backend.
 */

/** Texto mostrado cuando el backend responde 409 (usuario ya migrado). */
export const USER_ALREADY_MIGRATED_MESSAGE =
    'El usuario ya fue migrado.';

/**
 * Texto genérico para cualquier 4xx/5xx que no caiga en un código que el
 * front maneje de forma específica (p. ej. 423 cuenta bloqueada o 409
 * usuario migrado).
 */
export const UNKNOWN_ERROR_MESSAGE =
    'Error desconocido, por favor contacte a su administrador.';

/**
 * Códigos HTTP cuyo mensaje proviene del backend o tiene un manejo
 * dedicado en la UI (modales, redirecciones, validaciones de formulario).
 * Para estos NO se sobreescribe el mensaje original.
 *
 * - 422: validación de campos (el front arma el mensaje a partir de
 *   `error.errors`).
 * - 423: cuenta bloqueada — se redirige a /cuenta-bloqueada y el mensaje
 *   se preserva en el state de la navegación.
 */
const STATUSES_WITH_DEDICATED_HANDLING: ReadonlySet<number> = new Set([
    422,
    423
]);

interface AuthHttpErrorLike {
    status?: number;
    message?: string;
    error?: {
        title?: string;
        message?: string;
        mensaje?: string;
        errors?: Record<string, string[] | string>;
    };
}

/**
 * Resuelve el mensaje a mostrar al usuario en función del error HTTP recibido.
 *
 * Reglas (de mayor a menor prioridad):
 *   1. Si el status es 409 → siempre `USER_ALREADY_MIGRATED_MESSAGE`,
 *      sin importar lo que mande el backend.
 *   2. Si el error trae `errors` (validación 4xx) → se respeta el manejo
 *      previo: se devuelve el mensaje del backend (`mensaje` / `message` /
 *      `title`) o, en su defecto, el `fallbackMessage` recibido.
 *   3. Si el status pertenece a un código con manejo dedicado (423, etc.)
 *      → se respeta el mensaje original del backend / fallback.
 *   4. Si el status es 4xx o 5xx (no contemplado arriba) →
 *      `UNKNOWN_ERROR_MESSAGE`.
 *   5. En cualquier otro caso → mensaje del backend o `fallbackMessage`.
 *
 * @param error            El error capturado del observable HTTP.
 * @param fallbackMessage  Texto a usar cuando ni el backend ni las reglas
 *                         anteriores aplican. Es el "mensaje por defecto"
 *                         que la pantalla quiera mostrar.
 */
export function resolveAuthErrorMessage(
    error: unknown,
    fallbackMessage: string
): string {
    const err = (error ?? {}) as AuthHttpErrorLike;
    const status = typeof err.status === 'number' ? err.status : undefined;
    const backendMessage =
        err.error?.mensaje ||
        err.error?.message ||
        err.error?.title ||
        err.message ||
        '';

    // 1) 409 — usuario ya migrado (mensaje fijo, sobrescribe al backend).
    if (status === 409) {
        return USER_ALREADY_MIGRATED_MESSAGE;
    }

    // 2) Errores de validación (campo `errors` presente en el body): el
    //    componente ya construye el mensaje, aquí solo respetamos lo que
    //    venga del backend o el fallback original.
    if (err.error?.errors && typeof err.error.errors === 'object') {
        return backendMessage || fallbackMessage;
    }

    // 3) Códigos con manejo dedicado en la UI: respetamos su mensaje original.
    if (status !== undefined && STATUSES_WITH_DEDICATED_HANDLING.has(status)) {
        return backendMessage || fallbackMessage;
    }

    // 4) Cualquier otro 4xx o 5xx → mensaje genérico de error desconocido.
    if (status !== undefined && status >= 400 && status < 600) {
        return UNKNOWN_ERROR_MESSAGE;
    }

    // 5) Sin status HTTP claro (timeout, error de red, etc.) → mensaje del
    //    backend si lo hubiera, o el fallback que mande la pantalla.
    return backendMessage || fallbackMessage;
}