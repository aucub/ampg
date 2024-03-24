import { MiddlewareHandler } from "../deps.ts";
import { BaseModelParams } from "../types.ts";

const TOKEN_PREFIX = "Bearer ";

export const headersMiddleware = (): MiddlewareHandler => {
    return async function headersMiddleware(c, next) {
        const params: BaseModelParams = {};
        function getHeader(headerName: string): string | null {
            return c.req.header(headerName) || null;
        }
        function extractBearerToken(headerValue: string): string | null {
            if (headerValue.startsWith(TOKEN_PREFIX)) {
                return headerValue.slice(TOKEN_PREFIX.length).trim();
            }
            return null;
        }

        let apiKey = getHeader("X-Auth-Key") ||
            getHeader("x-portkey-api-key") ||
            extractBearerToken(getHeader("Authorization") || "") ||
            c.req.query("key");

        if (apiKey) {
            params.apiKey = apiKey;
        }

        const authEmail = getHeader("X-Auth-Email");
        if (authEmail) {
            params.user = authEmail;
        }

        const provider = getHeader("x-portkey-provider");
        if (provider) {
            params.provider = provider;
        }

        const baseURL = getHeader("x-portkey-baseURL");
        if (baseURL) {
            params.baseURL = baseURL;
        }

        const cache = getHeader("x-portkey-cache");
        if (cache) {
            params.cache = true;
        }

        const retryHeader = getHeader("x-portkey-retry");
        if (retryHeader) {
            const retry = parseInt(retryHeader, 10);
            if (!isNaN(retry)) {
                params.retry = { attempts: retry };
                const onStatusCodes = getHeader("x-portkey-on-status-codes");
                if (onStatusCodes) {
                    params.retry.onStatusCodes = onStatusCodes.split(",").map(Number).filter(n => !isNaN(n));
                }
            }
        }

        const traceId = getHeader("x-portkey-trace-id");
        if (traceId) {
            params.traceId = traceId;
        }

        c.set("params", params);
        await next();
    };
};
