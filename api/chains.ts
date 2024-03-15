import {
  cloudflareWorkersModel,
  googleGenaiModel,
  openAIModel,
  providers,
} from "../config.ts";
import { BaseLanguageModelInput } from "../deps.ts";
import {
  BaseModelParams,
  ChatModelParams,
  ImagesEditsParams,
  EmbeddingsParams,
  TranscriptionParams,
} from "../types.ts";
import {
  generateContentCloudflare,
  generateImagesEditsCloudflare,
  generateEmbeddingsCloudflare,
  generateTranscriptionCloudflare,
} from "./cloudflare.ts";
import {
  generateContentGoogleGenerativeAI,
  generateEmbeddingsGoogleGenerativeAI,
} from "./google-genai.ts";
import {
  generateChatCompletionOpenAI,
  generateEmbeddingsOpenAI,
  generateTranscriptionOpenAI,
} from "./openai.ts";

export function parseParams(
  params: BaseModelParams,
) {
  if (
    (!params["provider"] || !providers.includes(params["provider"])) &&
    params["modelName"] !== undefined
  ) {
    if (
      openAIModel.includes(params["modelName"] as string)
    ) {
      params["provider"] = "openapi";
    } else if (
      googleGenaiModel.includes(params["modelName"] as string)
    ) {
      params["provider"] = "google";
    } else if (
      cloudflareWorkersModel.includes(params["modelName"] as string)
    ) {
      params["provider"] = "cloudflareworkersai";
    }
  }
  return params;
}

export async function generateChat(
  params: ChatModelParams,
  chatHistory: BaseLanguageModelInput,
) {
  if (
    params["provider"] == "openai"
  ) {
    return await generateChatCompletionOpenAI(params, chatHistory);
  } else if (
    params["provider"] == "google" ||
    params["provider"] == "palm"
  ) {
    return await generateContentGoogleGenerativeAI(params, chatHistory);
  } else if (
    params["provider"] == "cloudflareworkersai"
  ) {
    return await generateContentCloudflare(params, chatHistory);
  }
}

export async function generateEmbeddings(
  params: EmbeddingsParams,
  input: string | string[],
) {
  if (
    params["provider"] == "openai"
  ) {
    return await generateEmbeddingsOpenAI(params, input);
  } else if (
    params["provider"] == "google" ||
    params["provider"] == "palm"
  ) {
    return await generateEmbeddingsGoogleGenerativeAI(params, input);
  } else if (
    params["provider"] == "cloudflareworkersai"
  ) {
    return generateEmbeddingsCloudflare(params, input);
  }
}

export async function generateTranscription(
  params: TranscriptionParams,
) {
  if (
    params["provider"] == "openai"
  ) {
    return await generateTranscriptionOpenAI(params);
  } else if (
    params["provider"] == "cloudflareworkersai"
  ) {
    return await generateTranscriptionCloudflare(params);
  }
}

export async function generateEditImage(
  params: ImagesEditsParams,
) {
  if (
    params["provider"] == "cloudflareworkersai"
  ) {
    return await generateImagesEditsCloudflare(params);
  }
}
