import { MiddlewareHandler } from "../deps.ts";
import {
  BaseModelParams,
  ChatModelParams,
  LLMOptions,
  PortkeyModelParams,
} from "../types.ts";

const TOKEN_STRINGS = "[A-Za-z0-9._~+/-]+=*";
const PREFIX = "Bearer";

export const headersMiddleware = (): MiddlewareHandler => {
  return async function headersMiddleware(c, next) {
    const params: BaseModelParams = {};
    let apiKey = c.req.header("X-Auth-Key");
    if (!apiKey) {
      apiKey = c.req.header("x-portkey-api-key");
    }
    if (!apiKey) {
      apiKey = c.req.header("Authorization");
      if (apiKey) {
        const regexp = new RegExp(
          "^" + PREFIX + " +(" + TOKEN_STRINGS + ") *$",
        );
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
    const user = c.req.header("X-Auth-Email");
    if (user) {
      params["user"] = user;
    }
    const provider = c.req.header("x-portkey-provider");
    if (provider) {
      params["provider"] = provider;
    }
    const baseURL = c.req.header("x-portkey-baseURL");
    if (baseURL) {
      params["baseURL"] = baseURL;
    }
    const cache = c.req.header("x-portkey-cache");
    if (cache) {
      params["cache"] = true;
    }
    const retry = c.req.header("x-portkey-retry");
    if (typeof retry === "number") {
      params["retry"] = { attempts: retry };
    } else if (typeof retry === "object" && retry !== null) {
      const retryParams = retry as {
        attempts?: number;
        on_status_codes?: number[];
      };
      if (typeof retryParams.attempts === "number") {
        params["retry"] = { attempts: retryParams.attempts };
        if (Array.isArray(retryParams.on_status_codes)) {
          const onStatusCodes = c.req.header("x-portkey-on-status-codes");
          if (onStatusCodes) {
            params["retry"]["onStatusCodes"] = onStatusCodes.split(",").map(
              Number,
            );
          }
        }
      }
    }
    const traceId = c.req.header("x-portkey-trace-id");
    if (traceId) {
      params["traceId"] = traceId;
    }
    const config = c.req.header("x-portkey-config");
    if (config) {
      const llms: LLMOptions[] = JSON.parse(config);
      if (llms) {
        params as PortkeyModelParams;
        params["llms"] = llms;
      }
    }
    c.set("params", params);
    await next();
  };
};
