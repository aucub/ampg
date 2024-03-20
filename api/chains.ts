import {
  cloudflareWorkersAIModel,
  googleGenaiModel,
  openAIModel,
  Providers,
} from "../config.ts";
import { BaseLanguageModelInput } from "../deps.ts";
import {
  BaseModelParams,
  ChatModelParams,
  EmbeddingParams,
  ImageEditParams,
  LangException,
  TranscriptionParams,
} from "../types.ts";
import {
  speechRecognitionCloudflare,
  textEmbeddingsCloudflare,
  textGenerationCloudflare,
  textToImageCloudflare,
} from "./cloudflare.ts";
import {
  embedContentGoogleGenerativeAI,
  generateContentGoogleGenerativeAI,
} from "./google-genai.ts";
import {
  adaptErrorResponseOpenAI,
  chatCompletionOpenAI,
  embeddingOpenAI,
  transcriptionOpenAI,
} from "./openai.ts";

export function parseParams(
  params: BaseModelParams,
) {
  if (
    (!params["provider"] ||
      !Object.values(Providers).includes(params["provider"] as Providers)) &&
    params["modelName"] !== undefined &&
    params["modelName"] !== null
  ) {
    if (
      openAIModel.includes(params["modelName"] as string)
    ) {
      params["provider"] = Providers.OPENAI;
    } else if (
      googleGenaiModel.includes(params["modelName"] as string)
    ) {
      params["provider"] = Providers.GOOGLE;
    } else if (
      cloudflareWorkersAIModel.includes(params["modelName"] as string)
    ) {
      params["provider"] = Providers.CLOUDFLARE;
    }
  }
  return params;
}

export async function chatCompletion(
  params: ChatModelParams,
  chatHistory: BaseLanguageModelInput,
) {
  if (
    params["provider"] == Providers.OPENAI
  ) {
    return await chatCompletionOpenAI(params, chatHistory);
  } else if (
    params["provider"] == Providers.GOOGLE
  ) {
    return await generateContentGoogleGenerativeAI(params, chatHistory);
  } else if (
    params["provider"] == Providers.CLOUDFLARE
  ) {
    return await textGenerationCloudflare(params, chatHistory);
  }
}

export async function embedding(
  params: EmbeddingParams,
  input: string | string[],
) {
  if (
    params["provider"] == Providers.OPENAI
  ) {
    return await embeddingOpenAI(params, input);
  } else if (
    params["provider"] == Providers.GOOGLE
  ) {
    return await embedContentGoogleGenerativeAI(params, input);
  } else if (
    params["provider"] == Providers.CLOUDFLARE
  ) {
    return await textEmbeddingsCloudflare(params, input);
  }
}

export async function transcription(
  params: TranscriptionParams,
) {
  if (
    params["provider"] == Providers.OPENAI
  ) {
    return await transcriptionOpenAI(params);
  } else if (
    params["provider"] == Providers.CLOUDFLARE
  ) {
    return await speechRecognitionCloudflare(params);
  }
}

export async function imageEdit(
  params: ImageEditParams,
) {
  if (
    params["provider"] == Providers.CLOUDFLARE
  ) {
    return await textToImageCloudflare(params);
  }
}

export function parseError(
  params: BaseModelParams,
  exception: LangException,
) {
  if (
    params["provider"] == Providers.OPENAI
  ) {
    return adaptErrorResponseOpenAI(exception);
  }
}
