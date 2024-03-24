import { z } from "../../deps.ts";

const strategySchema = z.object({
  mode: z.enum(["single", "loadbalance", "fallback"]),
  on_status_codes: z.array(z.number()).optional(),
});

const cacheSchema = z.object({
  mode: z.enum(["simple", "semantic"]),
  max_age: z.number().optional(),
});

export const retrySchema = z.object({
  attempts: z.number(),
  on_status_codes: z.array(z.number()).optional(),
});

interface ConfigSchema {
  strategy?: z.infer<typeof strategySchema>;
  provider?:
    | "openai"
    | "anthropic"
    | "azure-openai"
    | "anyscale"
    | "cohere"
    | "palm";
  resource_name?: string;
  deployment_id?: string;
  api_version?: string;
  override_params?: Record<string, unknown>;
  api_key?: string;
  virtual_key?: string;
  cache?: z.infer<typeof cacheSchema>;
  retry?: z.infer<typeof retrySchema>;
  weight?: number;
  on_status_codes?: number[];
  targets?: ConfigSchema[];
}

const configSchema: z.ZodSchema<ConfigSchema> = z.lazy(() =>
  z.object({
    strategy: strategySchema.optional(),
    provider: z.enum([
      "openai",
      "anthropic",
      "azure-openai",
      "anyscale",
      "cohere",
      "palm",
    ]).optional(),
    resource_name: z.string().optional(),
    deployment_id: z.string().optional(),
    api_version: z.string().optional(),
    override_params: z.object({}).optional(),
    api_key: z.string().optional(),
    virtual_key: z.string().optional(),
    cache: cacheSchema.optional(),
    retry: retrySchema.optional(),
    weight: z.number().optional(),
    on_status_codes: z.array(z.number()).optional(),
    targets: z.lazy(() => z.array(configSchema)).optional(),
  }).refine((data) => {
    const providedKeys = Object.keys(data);
    const hasProvider = providedKeys.includes("provider") &&
      providedKeys.includes("api_key");
    const hasVirtualKey = providedKeys.includes("virtual_key");
    const hasStrategy = providedKeys.includes("strategy") &&
      providedKeys.includes("targets");
    const hasCache = providedKeys.includes("cache");
    const hasRetry = providedKeys.includes("retry");

    return hasProvider || hasVirtualKey || hasStrategy || hasCache || hasRetry;
  }, {
    message:
      "At least one of the following must be provided: provider + api_key, virtual_key, strategy + targets, cache, or retry",
  })
);

export type portkeyConfigSchema = z.infer<typeof configSchema>;
