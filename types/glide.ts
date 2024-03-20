// Imports
import { z } from "../deps.ts";

// Anthropic
const AnthropicConfig = z.object({
  baseUrl: z.string(),
  chatEndpoint: z.string(),
  model: z.string(),
  defaultParams: z.optional(z.lazy(() => AnthropicParams)),
});

const AnthropicParams = z.object({
  max_tokens: z.optional(z.number().int()),
  metadata: z.optional(z.string()),
  stop: z.optional(z.array(z.string())),
  system: z.optional(z.string()),
  temperature: z.optional(z.number()),
  top_k: z.optional(z.number().int()),
  top_p: z.optional(z.number()),
});

// AzureOpenAI
const AzureOpenAIConfig = z.object({
  apiVersion: z.string().describe("The API version to use for this operation. This follows the YYYY-MM-DD format (e.g 2023-05-15)"),
  baseUrl: z.string().describe("The name of your Azure OpenAI Resource (e.g https://glide-test.openai.azure.com/)"),
  model: z.string().describe("This is your deployment name. You're required to first deploy a model before you can make calls (e.g. glide-gpt-35)"),
  chatEndpoint: z.optional(z.string()),
  defaultParams: z.optional(z.lazy(() => AzureOpenAIParams)),
});

const AzureOpenAIParams = z.object({
  frequency_penalty: z.optional(z.number().int()),
  logit_bias: z.optional(z.record(z.number())),
  max_tokens: z.optional(z.number().int()),
  n: z.optional(z.number().int()),
  presence_penalty: z.optional(z.number().int()),
  response_format: z.optional(z.string()).describe("TODO: should this be a part of the chat request API?"),
  seed: z.optional(z.number().int()),
  stop: z.optional(z.array(z.string())),
  temperature: z.optional(z.number()),
  tool_choice: z.optional(z.unknown()),
  tools: z.optional(z.array(z.string())),
  top_p: z.optional(z.number()),
  user: z.optional(z.string()),
});

// Bedrock
const BedrockConfig = z.object({
  awsRegion: z.string(),
  baseUrl: z.string(),
  chatEndpoint: z.string(),
  model: z.string(),
  defaultParams: z.optional(z.lazy(() => BedrockParams)),
});

const BedrockParams = z.object({
  max_tokens: z.optional(z.number().int()),
  stop: z.optional(z.array(z.string())),
  temperature: z.optional(z.number()),
  top_p: z.optional(z.number()),
});

// ClientConfig
const ClientConfig = z.object({
  timeout: z.optional(z.string()),
});

// Cohere
const CohereConfig = z.object({
  baseUrl: z.string(),
  chatEndpoint: z.string(),
  model: z.string(),
  defaultParams: z.optional(z.lazy(() => CohereParams)),
});

const CohereParams = z.object({
  chat_history: z.optional(z.array(z.lazy(() => CohereHistory))),
  citiation_quality: z.optional(z.string()),
  connectors: z.optional(z.array(z.string())),
  conversation_id: z.optional(z.string()),
  preamble_override: z.optional(z.string()),
  prompt_truncation: z.optional(z.string()),
  search_queries_only: z.optional(z.boolean()),
  stream: z.optional(z.boolean()).describe("unsupported right now"),
  temperature: z.optional(z.number()),
});

const CohereHistory = z.object({
  message: z.string(),
  role: z.string(),
  user: z.string(),
});

// HTTP
const ErrorSchema = z.object({
  message: z.string(),
});

const HealthSchema = z.object({
  healthy: z.boolean(),
});

const RouterListSchema = z.object({
  routers: z.array(z.lazy(() => LangRouterConfig)),
});

// Latency
const LatencyConfig = z.object({
  decay: z.number().describe("Weight of new latency measurements"),
  update_interval: z.string().describe("How often gateway should probe models with not the lowest response latency"),
  warmup_samples: z.number().int().describe("The number of latency probes required to init moving average"),
});

// OctoML
const OctoMLConfig = z.object({
  baseUrl: z.string(),
  chatEndpoint: z.string(),
  model: z.string(),
  defaultParams: z.optional(z.lazy(() => OctoMLParams)),
});

const OctoMLParams = z.object({
  frequency_penalty: z.optional(z.number().int()),
  max_tokens: z.optional(z.number().int()),
  presence_penalty: z.optional(z.number().int()),
  stop: z.optional(z.array(z.string())),
  temperature: z.optional(z.number()),
  top_p: z.optional(z.number()),
});

// OllaMa
const OllamaConfig = z.object({
  baseUrl: z.string(),
  chatEndpoint: z.string(),
  model: z.string(),
  defaultParams: z.optional(z.lazy(() => OllamaParams)),
});

const OllamaParams = z.object({
  microstat: z.optional(z.number().int()),
  microstat_eta: z.optional(z.number()),
  microstat_tau: z.optional(z.number()),
  num_ctx: z.optional(z.number().int()),
  num_gpu: z.optional(z.number().int()),
  num_gqa: z.optional(z.number().int()),
  num_predict: z.optional(z.number().int()),
  num_thread: z.optional(z.number().int()),
  repeat_last_n: z.optional(z.number().int()),
  seed: z.optional(z.number().int()),
  stop: z.optional(z.array(z.string())),
  stream: z.optional(z.boolean()),
  temperature: z.optional(z.number()),
  tfs_z: z.optional(z.number()),
  top_k: z.optional(z.number().int()),
  top_p: z.optional(z.number()),
});

// OpenAI
const OpenAIConfig = z.object({
  baseUrl: z.string(),
  chatEndpoint: z.string(),
  model: z.string(),
  defaultParams: z.optional(z.lazy(() => OpenAIParams)),
});

const OpenAIParams = z.object({
  frequency_penalty: z.optional(z.number().int()),
  logit_bias: z.optional(z.record(z.number())),
  max_tokens: z.optional(z.number().int()),
  n: z.optional(z.number().int()),
  presence_penalty: z.optional(z.number().int()),
  response_format: z.optional(z.string()).describe("TODO: should this be a part of the chat request API?"),
  seed: z.optional(z.number().int()),
  stop: z.optional(z.array(z.string())),
  temperature: z.optional(z.number()),
  tool_choice: z.optional(z.unknown()),
  tools: z.optional(z.array(z.string())),
  top_p: z.optional(z.number()),
  user: z.optional(z.string()),
});

// Providers
const LangModelConfig = z.object({
  enabled: z.boolean().describe("Is the model enabled?"),
  id: z.string().describe("Model instance ID (unique in scope of the router)"),
  anthropic: z.optional(z.lazy(() => AnthropicConfig)),
  azureopenai: z.optional(z.lazy(() => AzureOpenAIConfig)),
  bedrock: z.optional(z.lazy(() => BedrockConfig)),
  client: z.optional(z.lazy(() => ClientConfig)),
  cohere: z.optional(z.lazy(() => CohereConfig)),
  error_budget: z.optional(z.string()),
  latency: z.optional(z.lazy(() => LatencyConfig)),
  octoml: z.optional(z.lazy(() => OctoMLConfig)),
  ollama: z.optional(z.lazy(() => OllamaConfig)),
  openai: z.optional(z.lazy(() => OpenAIConfig)).describe("Add other providers like"),
  weight: z.optional(z.number().int()),
});

// Retry
const ExpRetryConfig = z.object({
  base_multiplier: z.optional(z.number().int()),
  max_delay: z.optional(z.number().int()),
  max_retries: z.optional(z.number().int()),
  min_delay: z.optional(z.number().int()),
});

// Routers
const LangRouterConfig = z.object({
  enabled: z.boolean().describe("Is router enabled?"),
  models: z.array(z.lazy(() => LangModelConfig)).min(1).describe("the list of models that could handle requests"),
  retry: ExpRetryConfig.describe("retry when no healthy model is available to router"),
  routers: z.string().describe("Unique router ID"),
  strategy: z.string().describe("strategy on picking the next model to serve the request"),
});

// Schemas
const ChatMessage = z.object({
  content: z.string().describe("The content of the message."),
  name: z.optional(z.string()).describe("The name of the author of this message. May contain a-z, A-Z, 0-9, and underscores,\nwith a maximum length of 64 characters."),
  role: z.string().describe("The role of the author of this message. One of system, user, or assistant."),
});

const ChatRequest = z.object({
  message: ChatMessage,
  messageHistory: z.optional(z.array(ChatMessage)),
  override: z.optional(z.lazy(() => OverrideChatRequest)),
});

const ChatResponse = z.object({
  cached: z.optional(z.boolean()),
  created: z.optional(z.number().int()),
  id: z.optional(z.string()),
  model: z.optional(z.string()),
  modelResponse: z.optional(z.lazy(() => ModelResponse)),
  model_id: z.optional(z.string()),
  provider: z.optional(z.string()),
  router: z.optional(z.string()),
});

const ModelResponse = z.object({
  message: z.optional(ChatMessage),
  responseId: z.optional(z.record(z.string())),
  tokenCount: z.optional(z.lazy(() => TokenUsage)),
});

const OverrideChatRequest = z.object({
  message: ChatMessage,
  model_id: z.string(),
});

const TokenUsage = z.object({
  promptTokens: z.optional(z.number()),
  responseTokens: z.optional(z.number()),
  totalTokens: z.optional(z.number()),
});

// Exports
export {
  AnthropicConfig,
  AnthropicParams,
  AzureOpenAIConfig,
  AzureOpenAIParams,
  BedrockConfig,
  BedrockParams,
  ClientConfig,
  CohereConfig,
  CohereParams,
  CohereHistory,
  ErrorSchema,
  HealthSchema,
  RouterListSchema,
  LatencyConfig,
  OctoMLConfig,
  OctoMLParams,
  OllamaConfig,
  OllamaParams,
  OpenAIConfig,
  OpenAIParams,
  LangModelConfig,
  ExpRetryConfig,
  LangRouterConfig,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ModelResponse,
  OverrideChatRequest,
  TokenUsage,
};