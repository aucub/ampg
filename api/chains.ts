import {
  cloudflareWorkersModel,
  googleGenaiModel,
  openAIModel,
} from "../config.ts";
import { BaseLanguageModelInput, HonoRequest } from "../deps.ts";
import { ChatModelParams, EmbeddingsParams } from "../types.ts";
import { generateCloudflareWorkers } from "./cloudflare.ts";
import {
  generateContentGoogleGenerative,
  generateEmbeddingsGoogleGenerative,
} from "./google-genai.ts";
import {
  generateOpenAIChatCompletion,
  generateOpenAIEmbeddings,
} from "./openai.ts";

export async function generateChat(
  params: ChatModelParams,
  chatHistory: BaseLanguageModelInput,
) {
  if (params["modelName"] !== undefined) {
    if (
      params["provider"] == "openai" ||
      openAIModel.includes(params["modelName"])
    ) {
      return await generateOpenAIChatCompletion(params, chatHistory);
    } else if (
      params["provider"] == "google" ||
      params["provider"] == "palm" ||
      googleGenaiModel.includes(params["modelName"])
    ) {
      return await generateContentGoogleGenerative(params, chatHistory);
    } else if (
      params["provider"] == "cloudflareworkersai" ||
      cloudflareWorkersModel.includes(params["modelName"])
    ) {
      return await generateCloudflareWorkers(params, chatHistory);
    }
  }
}

export async function generateEmbeddings(
  params: EmbeddingsParams,
  input: string | string[],
) {
  if (params["modelName"] !== undefined) {
    if (
      params["provider"] == "openai" ||
      openAIModel.includes(params["modelName"])
    ) {
      return await generateOpenAIEmbeddings(params, input);
    } else if (
      params["provider"] == "google" ||
      params["provider"] == "palm" ||
      googleGenaiModel.includes(params["modelName"])
    ) {
      return await generateEmbeddingsGoogleGenerative(params, input);
    }
  }
}
