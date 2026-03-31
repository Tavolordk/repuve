export interface LoginFormEntity {
    usuario: string;
    correoElectronico: string;
    numeroCelular: string;
    captchaId: string;
    captchaRespuesta: string;
}
export type LoginApiResponse = {
    success: boolean;
    mensaje: string;
    data?: {
        token: string;
        tipoToken: string;
        expiracionMinutos: number;
        fechaExpiracionUtc: string;
    };
    errores?: unknown[];
    traceId?: string;
};
export interface LoginResponseEntity {
    success: boolean;
    mensaje: string;
    token: string;
    tipoToken: string;
    expiracionMinutos: number;
    fechaExpiracionUtc: string;
}