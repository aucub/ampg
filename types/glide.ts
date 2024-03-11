import { z } from "../deps.ts";

const anthropicConfigSchema = z.object({
  baseUrl: z.string(),
  chatEndpoint: z.string(),
  defaultParams: z.lazy(() => anthropicParamsSchema.nullable()),
  model: z.string(),
});

const anthropicParamsSchema = z.object({
  max_tokens: z.number().int().nullable(),
  metadata: z.string().nullable(),
  stop: z.array(z.string()).nullable(),
  system: z.string().nullable(),
  temperature: z.number().nullable(),
  top_k: z.number().int().nullable(),
  top_p: z.number().nullable(),
});

const azureopenaiConfigSchema = z.object({
  apiVersion: z.string().describe(
    "The API version to use for this operation. This follows the YYYY-MM-DD format (e.g 2023-05-15)",
  ),
  baseUrl: z.string().describe(
    "The name of your Azure OpenAI Resource (e.g https://glide-test.openai.azure.com/)",
  ),
  chatEndpoint: z.string().nullable(),
  defaultParams: z.lazy(() => azureopenaiParamsSchema.nullable()),
  model: z.string().describe(
    "This is your deployment name. You're required to first deploy a model before you can make calls (e.g. glide-gpt-35)",
  ),
});

const azureopenaiParamsSchema = z.object({
  frequency_penalty: z.number().nullable(),
  logit_bias: z.record(z.number()).nullable(),
  max_tokens: z.number().int().nullable(),
  n: z.number().int().nullable(),
  presence_penalty: z.number().nullable(),
  response_format: z.any().describe(
    "TODO: should this be a part of the chat request API?",
  ).nullable(),
  seed: z.number().int().nullable(),
  stop: z.array(z.string()).nullable(),
  temperature: z.number().nullable(),
  tool_choice: z.any().nullable(),
  tools: z.array(z.string()).nullable(),
  top_p: z.number().nullable(),
  user: z.string().nullable(),
});

const bedrockConfigSchema = z.object({
  awsRegion: z.string(),
  baseUrl: z.string(),
  chatEndpoint: z.string(),
  defaultParams: z.lazy(() => bedrockParamsSchema.nullable()),
  model: z.string(),
});

const bedrockParamsSchema = z.object({
  max_tokens: z.number().int().nullable(),
  stop: z.array(z.string()).nullable(),
  temperature: z.number().nullable(),
  top_p: z.number().nullable(),
});

const clientConfigSchema = z.object({
  timeout: z.string().nullable(),
});

const cohereChatHistorySchema = z.object({
  message: z.string(),
  role: z.string(),
  user: z.string(),
});

const cohereConfigSchema = z.object({
  baseUrl: z.string(),
  chatEndpoint: z.string(),
  defaultParams: z.lazy(() => cohereParamsSchema.nullable()),
  model: z.string(),
});

const cohereParamsSchema = z.object({
  chat_history: z.array(cohereChatHistorySchema).nullable(),
  citation_quality: z.string().nullable(),
  connectors: z.array(z.string()).nullable(),
  conversation_id: z.string().nullable(),
  preamble_override: z.string().nullable(),
  prompt_truncation: z.string().nullable(),
  search_queries_only: z.boolean().nullable(),
  stream: z.boolean().describe("unsupported right now").nullable(),
  temperature: z.number().nullable(),
});

const errorSchema = z.object({
  message: z.string(),
});

const healthSchema = z.object({
  healthy: z.boolean(),
});

const routerListSchema = z.object({
  routers: z.array(z.lazy(() => langRouterConfigSchema)),
});

const latencyConfigSchema = z.object({
  decay: z.number().describe("Weight of new latency measurements"),
  update_interval: z.string().describe(
    "How often gateway should probe models with not the lowest response latency",
  ),
  warmup_samples: z.number().int().describe(
    "The number of latency probes required to init moving average",
  ),
});

const octomlConfigSchema = z.object({
  baseUrl: z.string(),
  chatEndpoint: z.string(),
  defaultParams: z.lazy(() => octomlParamsSchema.nullable()),
  model: z.string(),
});

const octomlParamsSchema = z.object({
  frequency_penalty: z.number().nullable(),
  max_tokens: z.number().int().nullable(),
  presence_penalty: z.number().nullable(),
  stop: z.array(z.string()).nullable(),
  temperature: z.number().nullable(),
  top_p: z.number().nullable(),
});

const ollamaConfigSchema = z.object({
  baseUrl: z.string(),
  chatEndpoint: z.string(),
  defaultParams: z.lazy(() => ollamaParamsSchema.nullable()),
  model: z.string(),
});

const ollamaParamsSchema = z.object({
  microstat: z.number().int().nullable(),
  microstat_eta: z.number().nullable(),
  microstat_tau: z.number().nullable(),
  num_ctx: z.number().int().nullable(),
  num_gpu: z.number().int().nullable(),
  num_gqa: z.number().int().nullable(),
  num_predict: z.number().int().nullable(),
  num_thread: z.number().int().nullable(),
  repeat_last_n: z.number().int().nullable(),
  seed: z.number().int().nullable(),
  stop: z.array(z.string()).nullable(),
  stream: z.boolean().nullable(),
  temperature: z.number().nullable(),
  tfs_z: z.number().nullable(),
  top_k: z.number().int().nullable(),
  top_p: z.number().nullable(),
});

const openaiConfigSchema = z.object({
  baseUrl: z.string(),
  chatEndpoint: z.string(),
  defaultParams: z.lazy(() => openaiParamsSchema.nullable()),
  model: z.string(),
});

const openaiParamsSchema = z.object({
  frequency_penalty: z.number().nullable(),
  logit_bias: z.record(z.number()).nullable(),
  max_tokens: z.number().int().nullable(),
  n: z.number().int().nullable(),
  presence_penalty: z.number().nullable(),
  response_format: z.any().describe(
    "TODO: should this be a part of the chat request API?",
  ).nullable(),
  seed: z.number().int().nullable(),
  stop: z.array(z.string()).nullable(),
  temperature: z.number().nullable(),
  tool_choice: z.any().nullable(),
  tools: z.array(z.string()).nullable(),
  top_p: z.number().nullable(),
  user: z.string().nullable(),
});

const langModelConfigSchema = z.object({
  anthropic: anthropicConfigSchema.nullable(),
  azureopenai: azureopenaiConfigSchema.nullable(),
  bedrock: bedrockConfigSchema.nullable(),
  client: clientConfigSchema.nullable(),
  cohere: cohereConfigSchema.nullable(),
  enabled: z.boolean().describe("Is the model enabled?"),
  error_budget: z.string().nullable(),
  id: z.string().describe("Model instance ID (unique in scope of the router)"),
  latency: latencyConfigSchema.nullable(),
  octoml: octomlConfigSchema.nullable(),
  ollama: ollamaConfigSchema.nullable(),
  openai: openaiConfigSchema.nullable().describe(
    "Add other providers like",
  ),
  weight: z.number().int().nullable(),
});
const expRetryConfigSchema = z.object({
  base_multiplier: z.number().optional(),
  max_retries: z.number().optional(),
  retry_codes: z.array(z.number()).optional(),
});

const RetryPolicyOptions = ["DISABLED", "EXPONENTIAL_BACKOFF", "FIXED_DELAY"] as const;

const RetryPolicyOption = z.enum(RetryPolicyOptions);

const retrySettingsSchema = z.object({
  retry_policy: RetryPolicyOption.nullable(),
  exponential_backoff: expRetryConfigSchema.optional(),
  fixed_delay: z.object({
    delay_millis: z.number().optional(),
  }).optional(),
});

const methodConfigSchema = z.object({
  name: z.string(),
  retry_settings: retrySettingsSchema.optional(),
});

const langRouterConfigSchema = z.object({
  enabled: z.boolean().describe("Is router enabled?"),
  models: z.array(langModelConfigSchema).min(1).describe(
    "the list of models that could handle requests",
  ),
  retry: expRetryConfigSchema.describe(
    "retry when no healthy model is available to router",
  ),
  routers: z.string().describe("Unique router ID"),
  strategy: z.string().describe(
    "strategy on picking the next model to serve the request",
  ),
});

const chatMessageSchema = z.object({
  content: z.string().describe("The content of the message."),
  name: z.string().describe(
    "The name of the author of this message. May contain a-z, A-Z, 0-9, and underscores,\nwith a maximum length of 64 characters.",
  ).optional(),
  role: z.string().describe(
    "The role of the author of this message. One of system, user, or assistant.",
  ),
});

const chatRequestSchema = z.object({
  message: chatMessageSchema,
  messageHistory: z.array(chatMessageSchema).optional(),
  override: z.lazy(() => overrideChatRequestSchema).optional(),
});

const overrideChatRequestSchema = z.object({
  message: chatMessageSchema,
  model_id: z.string(),
});

const modelResponseSchema = z.object({
  message: chatMessageSchema,
  responseId: z.record(z.string()),
  tokenCount: z.lazy(() => tokenUsageSchema),
});

const tokenUsageSchema = z.object({
  promptTokens: z.number(),
  responseTokens: z.number(),
  totalTokens: z.number(),
});

const chatResponseSchema = z.object({
  cached: z.boolean(),
  created: z.number().int(),
  id: z.string(),
  model: z.string(),
  model_id: z.string(),
  modelResponse: modelResponseSchema,
  provider: z.string(),
  router: z.string(),
});

type AnthropicConfig = z.infer<typeof anthropicConfigSchema>;
type AnthropicParams = z.infer<typeof anthropicParamsSchema>;
type AzureOpenAIConfig = z.infer<typeof azureopenaiConfigSchema>;
type AzureOpenAIParams = z.infer<typeof azureopenaiParamsSchema>;
type BedrockConfig = z.infer<typeof bedrockConfigSchema>;
type BedrockParams = z.infer<typeof bedrockParamsSchema>;
type ClientConfig = z.infer<typeof clientConfigSchema>;
type CohereChatHistory = z.infer<typeof cohereChatHistorySchema>;
type CohereConfig = z.infer<typeof cohereConfigSchema>;
type CohereParams = z.infer<typeof cohereParamsSchema>;
type OctoMLConfig = z.infer<typeof octomlConfigSchema>;
type OctoMLParams = z.infer<typeof octomlParamsSchema>;
type OllamaConfig = z.infer<typeof ollamaConfigSchema>;
type OllamaParams = z.infer<typeof ollamaParamsSchema>;
type OpenAIConfig = z.infer<typeof openaiConfigSchema>;
type OpenAIParams = z.infer<typeof openaiParamsSchema>;
type LangModelConfig = z.infer<typeof langModelConfigSchema>;
type LatencyConfig = z.infer<typeof latencyConfigSchema>;
type ExpRetryConfig = z.infer<typeof expRetryConfigSchema>;
type RetrySettings = z.infer<typeof retrySettingsSchema>;
type MethodConfig = z.infer<typeof methodConfigSchema>;
type LangRouterConfig = z.infer<typeof langRouterConfigSchema>;
type ChatMessage = z.infer<typeof chatMessageSchema>;
type ChatRequest = z.infer<typeof chatRequestSchema>;
type OverrideChatRequest = z.infer<typeof overrideChatRequestSchema>;
type ModelResponse = z.infer<typeof modelResponseSchema>;
type TokenUsage = z.infer<typeof tokenUsageSchema>;
type ChatResponse = z.infer<typeof chatResponseSchema>;
type RetryPolicyOption = z.infer<typeof RetryPolicyOption>;
type Error = z.infer<typeof errorSchema>;
type Health = z.infer<typeof healthSchema>;
type RouterList = z.infer<typeof routerListSchema>;

export const glideSchemas = {
  AnthropicConfig: anthropicConfigSchema.parse({}),
  AnthropicParams: anthropicParamsSchema.parse({}),
  AzureOpenAIConfig: azureopenaiConfigSchema.parse({}),
  AzureOpenAIParams: azureopenaiParamsSchema.parse({}),
  BedrockConfig: bedrockConfigSchema.parse({}),
  BedrockParams: bedrockParamsSchema.parse({}),
  ClientConfig: clientConfigSchema.parse({}),
  CohereChatHistory: cohereChatHistorySchema.parse({}),
  CohereConfig: cohereConfigSchema.parse({}),
  CohereParams: cohereParamsSchema.parse({}),
  OctoMLConfig: octomlConfigSchema.parse({}),
  OctoMLParams: octomlParamsSchema.parse({}),
  OllamaConfig: ollamaConfigSchema.parse({}),
  OllamaParams: ollamaParamsSchema.parse({}),
  OpenAIConfig: openaiConfigSchema.parse({}),
  OpenAIParams: openaiParamsSchema.parse({}),
  LangModelConfig: langModelConfigSchema.parse({}),
  LatencyConfig: latencyConfigSchema.parse({}),
  ExpRetryConfig: expRetryConfigSchema.parse({}),
  RetrySettings: retrySettingsSchema.parse({}),
  MethodConfig: methodConfigSchema.parse({}),
  LangRouterConfig: langRouterConfigSchema.parse({}),
  ChatMessage: chatMessageSchema.parse({}),
  ChatRequest: chatRequestSchema.parse({}),
  OverrideChatRequest: overrideChatRequestSchema.parse({}),
  ModelResponse: modelResponseSchema.parse({}),
  TokenUsage: tokenUsageSchema.parse({}),
  ChatResponse: chatResponseSchema.parse({}),
  RetryPolicyOption: RetryPolicyOption.parse("DISABLED"),
  Error: errorSchema.parse({}),
  Health: healthSchema.parse({}),
  RouterList: routerListSchema.parse({})
};

export const glideConfigSchema = z.object({
  name: z.string(),
  method_configs: z.array(methodConfigSchema),
});

export type GlideServiceConfig = z.infer<typeof glideConfigSchema>;