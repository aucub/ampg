import { MiddlewareHandler } from "../deps.ts";
import { BaseModelParams, GatewayParams } from "../types.ts";

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
      extractBearerToken(getHeader("Authorization") || "") ||
      c.req.query("key");

    if (apiKey) {
      params.apiKey = apiKey;
    }

    const authEmail = getHeader("X-Auth-Email");
    if (authEmail) {
      params.user = authEmail;
    }

    const gatewayParams: GatewayParams = c.req.query();
    const mergedParams = {
      ...(gatewayParams.options || {}),
      ...params,
    };
    c.set("params", mergedParams);
    await next();
  };
};
