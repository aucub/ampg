import { MiddlewareHandler, qs } from "../deps.ts";
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
      extractBearerToken(getHeader("Authorization") || "") ||
      c.req.query("key");

    if (apiKey) {
      params.apiKey = apiKey;
    }

    const authEmail = getHeader("X-Auth-Email");
    if (authEmail) {
      params.user = authEmail;
    }
    const queryString = new URL(c.req.url).search.slice(1);
    const gatewayParams = qs.parse(queryString);
    const mergedParams = {
      ...(gatewayParams.options as Record<string, unknown>),
      ...params,
    };
    c.set("query", gatewayParams);
    c.set("params", mergedParams);
    await next();
  };
};
