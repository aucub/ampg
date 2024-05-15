import { BaseChatModelCallOptions, BaseLanguageModelInput, z } from "./deps.ts";

export interface BaseModelParams {
  /**
   * Unique string identifier representing your end-user.
   */
  user?: string;
  /**
   * Model name to use.
   */
  model?: string;
  /**
   * API key to use when making requests.
   */
  apiKey?: string;
  /**
   * Override the default base URL for the API.
   */
  baseURL?: string;
  /**
   * Caching configuration.
   */
  cache?: boolean;
  /**
   * The maximum number of retries that can be made for a single call.
   */
  maxRetries?: number;
}

export interface ChatModelParams extends BaseModelParams {
  /**
   * The randomness of the responses.
   */
  temperature?: number;
  /**
   * Maximum number of tokens to generate in the completion.
   */
  maxTokens?: number;
  /**
   * Consider the n most likely tokens.
   */
  topK?: number;
  /**
   * Total probability mass of tokens to consider at each step
   */
  topP?: number;
  /**
   * Number of completions to generate for each prompt
   */
  n?: number;
  /**
   * Whether to stream the results or not.
   */
  streaming?: boolean;
  /**
   *  List of stop words to use when generating
   */
  stopSequences?: string[];
  input?: BaseLanguageModelInput;
  options?: BaseChatModelCallOptions;
}

export interface EmbeddingParams extends BaseModelParams {
  /**
   * The maximum number of documents to embed in a single request.
   */
  batchSize?: number;
  /**
   * Whether to strip new lines from the input text.
   */
  stripNewLines?: boolean;
  input?: string[] | string;
}

export interface OpenAIError {
  code: string | number | null;
  message: string;
  param: string | null;
  type: string;
}

export class LangException extends Error {
  llmOutput?: string;
  toolOutput?: string;
  observation?: string;
}

export interface GatewayParams {
  /**
   * The provider to use for your calls. This is required.
   */
  provider: string;
  /**
   * The name of the format provider used to determine how the request body should be parsed.
   */
  model: string;
  /**
   * Additional model parameters (optional).
   */
  options?: any;
  endpoint?: any;
}

export const GatewayParamsSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  options: z.any().optional(),
  endpoint: z.any().optional(),
}).passthrough();
