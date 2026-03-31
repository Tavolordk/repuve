export interface CaptchaEntity {
    captchaId: string;
    captchaImage: string;
    ttlSeconds: number;
}
export type CaptchaApiResponse = {
    success: boolean;
    mensaje: string;
    data: {
        id: string;
        imageBase64: string;
        ttlSeconds: number;
    };
    errores: unknown[];
    traceId: string;
};