import { MiddlewareHandler, IterableReadableStream, streamSSE } from "../deps.ts";
import { ChatModelParams } from "../types.ts";

const TOKEN_STRINGS = "[A-Za-z0-9._~+/-]+=*";
const PREFIX = "Bearer";


export const headersMiddleware = (): MiddlewareHandler => {
  return async function headersMiddleware(c, next) {
    const params: ChatModelParams = {};
    let apiKey = await c.req.header("x-portkey-api-key");
    if (!apiKey) {
      apiKey = await c.req.header("Authorization");
      if (apiKey) {
        const regexp = new RegExp("^" + PREFIX + " +(" + TOKEN_STRINGS + ") *$");
        const match = regexp.exec(apiKey);
        if (match) {
          apiKey = match[1];
        }
      }
      if (!apiKey) {
        apiKey = c.req.query("key");
      }
    }
    if (apiKey) {
      params["apiKey"] = apiKey;
    }
    const provider = await c.req.header("x-portkey-provider");
    if (provider) {
      params["provider"] = provider;
    }
    const baseURL = await c.req.header("x-portkey-baseURL");
    if (baseURL) {
      params["baseURL"] = baseURL;
    }
    const cache = await c.req.header("x-portkey-cache");
    if (cache) {
      params["cache"] = true;
    }
    const retry = await c.req.header("x-portkey-retry");
    if (typeof retry === "number") {
      params["retry"] = { attempts: retry };
    } else if (typeof retry === "object" && retry !== null) {
      const retryParams = retry as { attempts?: number; on_status_codes?: number[] };
      if (typeof retryParams.attempts === "number") {
        params["retry"] = { attempts: retryParams.attempts };
        if (Array.isArray(retryParams.on_status_codes)) {
          const onStatusCodes = await c.req.header("x-portkey-on-status-codes");
          if (onStatusCodes) {
            params["retry"]["onStatusCodes"] = onStatusCodes.split(",").map(Number);
          }
        }
      }
    }
    const traceId = await c.req.header("x-portkey-trace-id");
    if (traceId) {
      params["traceId"] = traceId;
    }
    if (provider) {
      params["provider"] = provider;
    }
    c.set("params", params);
    await next();
  }
}