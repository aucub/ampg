import { BaseLanguageModelInput, z } from "./deps.ts";

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
  stop?: string[];
  input?: BaseLanguageModelInput;
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
   * The sampling temperature, between 0 and 1.
   */
  temperature?: boolean;
  /**
   * The audio file object (not file name) to transcribe.
   */
  file?: File;
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
   * image height, in pixel space.
   */
  height?: number;
  /**
   * image width, in pixel space.
   */
  width?: number;
  /**
   * The style of the generated images.
   */
  style?: string;
  /**
   * Sampling steps.
   */
  steps?: number;
  /**
   * CFG Scale.
   */
  cfgScale?: number;
  /**
   * Random noise seed.
   */
  seed?: number;
}

export interface ImageEditParams extends BaseModelParams {
  /**
   * The image to edit.
   */
  image?: File;
  /**
   * A text description of the desired image(s).
   */
  prompt?: string;
  /**
   * An additional image used as a mask. Fully transparent areas (where alpha is zero)
   * indicate where the image should be edited.
   */
  mask?: File;
  /**
   * image height, in pixel space.
   */
  height?: number;
  /**
   * image width, in pixel space.
   */
  width?: number;
  /**
   * The format in which the generated images are returned.
   */
  response_format?: string;
  /**
   * The scale for the guided sampling.
   */
  guidance?: number;
  /**
   * number of steps (controls image quality).
   */
  num_steps?: number;
  /**
   * strength for noising/unnoising. 1.0 corresponds to full destruction of information in init image.
   */
  strength?: number;
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
