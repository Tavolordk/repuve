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
 * Texto mostrado cuando el backend devuelve un 400 con `errors.usuario`
 * (formato/longitud incorrecta). En el flujo de generar-contraseña esto
 * ocurre típicamente cuando el usuario teclea una cuenta vieja que aún
 * no fue renovada/migrada al nuevo formato.
 */
export const INVALID_RENEWED_ACCOUNT_MESSAGE =
    'La cuenta ingresada no corresponde a una cuenta renovada válida. ' +
    'Verifica que la cuenta sea correcta e inténtalo nuevamente.';

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
 *   2. Si el error trae `errors.usuario` (validación 4xx donde el campo
 *      con problema es la cuenta de usuario) → mensaje específico de
 *      cuenta no renovada (`INVALID_RENEWED_ACCOUNT_MESSAGE`). Esto
 *      sobrescribe el texto en inglés que manda .NET por defecto
 *      ("One or more validation errors occurred.").
 *   3. Si el error trae `errors` pero por OTRO campo distinto de
 *      `usuario` → se respeta el manejo previo: se devuelve el mensaje
 *      del backend (`mensaje` / `message` / `title`) o el `fallbackMessage`.
 *   4. Si el status pertenece a un código con manejo dedicado (423, etc.)
 *      → se respeta el mensaje original del backend / fallback.
 *   5. Si el status es 4xx o 5xx (no contemplado arriba) →
 *      `UNKNOWN_ERROR_MESSAGE`.
 *   6. En cualquier otro caso → mensaje del backend o `fallbackMessage`.
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

    // 2-3) Errores de validación con `errors`.
    const validationErrors = err.error?.errors;
    if (validationErrors && typeof validationErrors === 'object') {
        // 2) Si el campo problemático es la cuenta de usuario, mostramos un
        //    mensaje en español propio en lugar del genérico inglés del
        //    backend ("One or more validation errors occurred.").
        if (hasUsuarioValidationError(validationErrors)) {
            return INVALID_RENEWED_ACCOUNT_MESSAGE;
        }

        // 3) Otros campos de validación: respetamos el manejo previo.
        return backendMessage || fallbackMessage;
    }

    // 4) Códigos con manejo dedicado en la UI: respetamos su mensaje original.
    if (status !== undefined && STATUSES_WITH_DEDICATED_HANDLING.has(status)) {
        return backendMessage || fallbackMessage;
    }

    // 5) Cualquier otro 4xx o 5xx → mensaje genérico de error desconocido.
    if (status !== undefined && status >= 400 && status < 600) {
        return UNKNOWN_ERROR_MESSAGE;
    }

    // 6) Sin status HTTP claro (timeout, error de red, etc.) → mensaje del
    //    backend si lo hubiera, o el fallback que mande la pantalla.
    return backendMessage || fallbackMessage;
}

/**
 * Devuelve `true` si el objeto `errors` del backend contiene una entrada
 * para el campo `usuario` (con o sin variantes de capitalización) y esa
 * entrada efectivamente trae al menos un mensaje. Comparaciones case-
 * insensitive porque el backend a veces serializa con `Usuario`.
 */
function hasUsuarioValidationError(
    errors: Record<string, string[] | string>
): boolean {
    for (const key of Object.keys(errors)) {
        if (key.toLowerCase() !== 'usuario') {
            continue;
        }

        const value = errors[key];
        if (Array.isArray(value)) {
            return value.some((m) => typeof m === 'string' && !!m.trim());
        }
        if (typeof value === 'string') {
            return !!value.trim();
        }
    }
    return false;
}