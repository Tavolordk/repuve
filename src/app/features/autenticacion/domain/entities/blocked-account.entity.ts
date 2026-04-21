export interface BlockedActivationRequestEntity {
    usuario: string;
    correoElectronico: string;
    captchaId: string;
    captchaRespuesta: string;
}

export interface BlockedActivationResponseEntity {
    success: boolean;
    mensaje: string;
    usuario: string;
    solicitudEnviada: boolean;
}

export interface ReactivateAccountResponseEntity {
    success: boolean;
    mensaje: string;
    nombreUsuario: string;
    usuario: string;
    correoElectronico: string;
    token: string;
    tipoToken: string;
    expiracionMinutos: number;
    fechaExpiracionUtc: string;
    tokenConsumido: boolean;
    reactivacionProcesada: boolean;
}

export interface ResolveReactivationRequestEntity {
    usuario: string;
    aceptar: boolean;
    motivoNegacion?: string;
}

export interface ResolveReactivationResponseEntity {
    success: boolean;
    mensaje: string;
    usuario: string;
    aceptado: boolean;
    procesado: boolean;
    contrasenaActualizada: boolean;
    motivoNegacion?: string;
}

type ApiEnvelope<T> = {
    success: boolean;
    mensaje: string;
    data?: T;
    errores?: unknown[];
    traceId?: string;
};

export type BlockedActivationApiResponse = ApiEnvelope<{
    usuario: string;
    solicitudEnviada: boolean;
}>;

export type ReactivateAccountApiResponse = ApiEnvelope<{
    nombreUsuario: string;
    usuario: string;
    correoElectronico: string;
    token: string;
    tipoToken: string;
    expiracionMinutos: number;
    fechaExpiracionUtc: string;
    tokenConsumido: boolean;
    reactivacionProcesada: boolean;
}>;

export type ResolveReactivationApiResponse = ApiEnvelope<{
    usuario: string;
    aceptado: boolean;
    procesado: boolean;
    contrasenaActualizada: boolean;
    motivoNegacion?: string | null;
}>;