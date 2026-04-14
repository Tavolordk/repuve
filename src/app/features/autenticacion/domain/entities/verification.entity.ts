export interface SendVerificationCodeRequestEntity {
    usuario: string;
    correoElectronico?: string | null;
    numeroCelular?: string | null;
    medioContacto: 'correo' | 'telegram';
    captchaId?: string | null;
    captchaRespuesta?: string | null;
}

export interface SendVerificationCodeResponseEntity {
    success: boolean;
    mensaje: string;
    usuario: string;
    canal: string;
    codigoEnviado: boolean;
}

export interface VerifyCodeRequestEntity {
    usuario: string;
    codigo: string;
    medioContacto: 'correo' | 'telegram';
}

export interface VerifyCodeResponseEntity {
    success: boolean;
    mensaje: string;
    usuario: string;
    codigoVerificado: boolean;
    fechaExpiracionUtc?: string | null;
}

export interface ActivationFlowRequestEntity {
    token: string;
}

export interface ActivationFlowResponseEntity {
    success: boolean;
    mensaje: string;
    usuario: string;
    token: string;
    tipoToken: string;
    expiracionMinutos: number;
    fechaExpiracionUtc: string;
    flujoActivacionIniciado: boolean;
}

type ApiEnvelope<T> = {
    success: boolean;
    mensaje: string;
    data?: T;
    errores?: unknown[];
    traceId?: string;
};

export type SendVerificationCodeApiResponse = ApiEnvelope<{
    usuario: string;
    canal: string;
    codigoEnviado: boolean;
}>;

export type VerifyCodeApiResponse = ApiEnvelope<{
    usuario: string;
    codigoVerificado: boolean;
    fechaExpiracionUtc?: string | null;
}>;

export type ActivationFlowApiResponse = ApiEnvelope<{
    usuario: string;
    token: string;
    tipoToken: string;
    expiracionMinutos: number;
    fechaExpiracionUtc: string;
    flujoActivacionIniciado: boolean;
}>;