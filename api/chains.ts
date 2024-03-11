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
  EmbeddingsParams,
} from "../types.ts";
import { generateCloudflareWorkers } from "./cloudflare.ts";
import {
  generateContentGoogleGenerative,
  generateEmbeddingsGoogleGenerative,
} from "./google-genai.ts";
import {
  generateOpenAIChatCompletion,
  generateOpenAIEmbeddings,
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
    return await generateOpenAIChatCompletion(params, chatHistory);
  } else if (
    params["provider"] == "google" ||
    params["provider"] == "palm"
  ) {
    return await generateContentGoogleGenerative(params, chatHistory);
  } else if (
    params["provider"] == "cloudflareworkersai"
  ) {
    return await generateCloudflareWorkers(params, chatHistory);
  }
}

export async function generateEmbeddings(
  params: EmbeddingsParams,
  input: string | string[],
) {
  if (
    params["provider"] == "openai"
  ) {
    return await generateOpenAIEmbeddings(params, input);
  } else if (
    params["provider"] == "google" ||
    params["provider"] == "palm"
  ) {
    return await generateEmbeddingsGoogleGenerative(params, input);
  }
}
