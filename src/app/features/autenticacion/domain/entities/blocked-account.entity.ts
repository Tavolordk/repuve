export interface BlockedActivationRequestEntity {
    usuario: string;
    correoElectronico: string;
    captchaId: string;
    captchaRespuesta: string;
}

export interface BlockedActivationResponseEntity {
    success: boolean;
    mensaje: string;
    solicitudId: string;
}

export interface ActivationSolicitudEntity {
    solicitudId: string;
    nombre: string;
    usuario: string;
    correoElectronico: string;
    numeroCelular: string;
    fechaSolicitud: string;
    estado: 'pendiente' | 'aceptada' | 'denegada';
}

export interface ActivationSolicitudesResponseEntity {
    success: boolean;
    mensaje: string;
    solicitudes: ActivationSolicitudEntity[];
}

export interface ProcessActivationRequestEntity {
    solicitudId: string;
    accion: 'aceptar' | 'denegar';
    motivoDenegacion?: string;
}

export interface ProcessActivationResponseEntity {
    success: boolean;
    mensaje: string;
}

export interface ValidateBlockedCodeRequestEntity {
    usuario: string;
    codigo: string;
}

export interface ValidateBlockedCodeResponseEntity {
    success: boolean;
    mensaje: string;
    codigoVerificado: boolean;
}

type ApiEnvelope<T> = {
    success: boolean;
    mensaje: string;
    data?: T;
    errores?: unknown[];
    traceId?: string;
};

export type BlockedActivationApiResponse = ApiEnvelope<{
    solicitudId: string;
}>;

export type ActivationSolicitudesApiResponse = ApiEnvelope<{
    solicitudes: ActivationSolicitudEntity[];
}>;

export type ProcessActivationApiResponse = ApiEnvelope<Record<string, never>>;

export type ValidateBlockedCodeApiResponse = ApiEnvelope<{
    usuario: string;
    codigoVerificado: boolean;
}>;