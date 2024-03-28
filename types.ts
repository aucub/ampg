import { BaseLanguageModelInput } from "./deps.ts";

export interface BaseModelParams {
  /**
   * Unique string identifier representing your end-user.
   */
  user?: string;
  /**
   * Model name to use.
   */
  modelName?: string;
  /**
   * API key to use when making requests.
   */
  apiKey?: string;
  /**
   * Override the default base URL for the API.
   */
  baseURL?: string;
  /**
   * The AI provider to use for your calls.
   */
  provider?: string;
  /**
   * Caching configuration.
   */
  cache?: boolean;
  /**
   * Retry configuration.
   */
  retry?: Retry;
  /**
   * Returns a unique trace id for each response.
   */
  traceId?: string;
}

export interface Retry {
  /**
   * Number of retry attempts.
   */
  attempts?: number;
  /**
   * Status codes to trigger retries.
   */
  onStatusCodes?: number[];
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
  stop?: string[];
  /**
   * If null, a random seed will be used.
   */
  seed?: number;
  input?: BaseLanguageModelInput;
}

export interface EmbeddingParams extends BaseModelParams {
  encoding_format?: string;
  /**
   * An optional title for the text.
   */
  title?: string;
  /**
   * The maximum number of documents to embed in a single request.
   */
  batchSize?: number;
  /**
   * Whether to strip new lines from the input text. Default to true
   */
  stripNewLines?: boolean;
  input?: string[] | string;
}

export interface TranscriptionParams extends BaseModelParams {
  /**
   * Transcribes audio into the input language.
   */
  language?: string;
  /**
   * An optional text to guide the model's style or continue a previous audio segment. The [prompt] should match the audio language.
   */
  prompt?: string;
  /**
   * The format of the transcript output, in one of these options: `json`, `text`, `srt`, `verbose_json`, or `vtt`.
   */
  response_format?: string;
  /**
   * The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use [log probability](https://en.wikipedia.org/wiki/Log_probability) to automatically increase the temperature until certain thresholds are hit.
   */
  temperature?: boolean;
  /**
   * The audio file object (not file name) to transcribe, in one of these formats: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, or webm.
   */
  file?: File;
  /**
   * The timestamp granularities to populate for this transcription. `response_format` must be set `verbose_json` to use timestamp granularities. Either or both of these options are supported: `word`, or `segment`. Note: There is no additional latency for segment timestamps, but generating word timestamps incurs additional latency.
   */
  timestampGranularities?: ("word" | "segment")[];
}

export interface ImageGenerationParams extends BaseModelParams {
  /**
   * A text description of the desired image(s).
   */
  prompt?: string;
  /**
   * The format in which the generated images are returned.
   */
  response_format?: string;
  /**
   *  The number of images to generate.
   */
  n?: number;
  /**
   * The quality of the image that will be generated.
   */
  quality?: string;
  /**
   * The size of the generated images.
   */
  size?: string;
  /**
   * The style of the generated images.
   */
  style?: string;
}

export interface ImageEditParams extends BaseModelParams {
  image?: File;
  prompt?: string;
  mask?: File;
  n?: number;
  size?: string;
  response_format?: string;
  guidance?: number;
  num_steps?: number;
  strength?: number;
}

export interface PortkeyModelParams extends ChatModelParams {
  /**
   * Gets the provider options based on the specified mode.
   * Modes can be "single"(uses the first provider), "loadbalance"(selects one provider based on weights),
   * or "fallback"(uses all providers in the given order).If the mode does not match these options, null is returned.
   */
  mode?: string;
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
   * Caching configuration (optional).
   */
  cache?: boolean;
  /**
   * Retry configuration (optional).
   */
  retry?: Retry;
  /**
   * Returns a unique trace id for each response (optional).
   */
  trace_id?: string;
  /**
   * The name of the format provider used to determine how the request body should be parsed.
   */
  model: string;
  /**
   * Additional model parameters (optional).
   */
  options?: any;
}