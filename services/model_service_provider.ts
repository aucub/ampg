import { IExceptionHandling } from "../types/i_service.ts";
import {
  cloudflareWorkersAIModel,
  googleGenaiModel,
  openAIModel,
  Providers,
} from "../config.ts";
import {
  OpenAIChatService,
  OpenAIEmbeddingService,
  OpenAIExceptionHandling,
  OpenAIImageGenerationService,
  OpenAITranscriptionService,
} from "./openai_service.ts";
import {
  GoogleGenerativeAIChatService,
  GoogleGenerativeAIEmbeddingService,
} from "./google_genai_service.ts";
import {
  CloudflareWorkersAIChatService,
  CloudflareWorkersAIEmbeddingService,
  CloudflareWorkersAIImageEditService,
  CloudflareWorkersAITranscriptionService,
} from "./cloudflare_service.ts";
import { BaseModelParams } from "../types.ts";
import {
  HuggingFaceInferenceChatService,
  HuggingFaceInferenceEmbeddingService,
} from "./hf_service.ts";
import { PortkeyChatService } from "./portkey_service.ts";
import { GlideChatService } from "./glide_service.ts";

function getProviderByModelName(modelName: string): Providers | undefined {
  if (openAIModel.includes(modelName)) {
    return Providers.OPENAI;
  } else if (googleGenaiModel.includes(modelName)) {
    return Providers.GOOGLE;
  } else if (cloudflareWorkersAIModel.includes(modelName)) {
    return Providers.CLOUDFLARE;
  }
  return undefined;
}

export function assignProvider(params: BaseModelParams): BaseModelParams {
  const { provider, modelName } = params;

  if (
    !provider ||
    !Object.values(Providers).includes(params["provider"] as Providers)
  ) {
    params.provider = modelName ? getProviderByModelName(modelName) : undefined;
  }

  return params;
}

/**
 * 获取服务实例的通用函数。
 *
 * @param serviceType 服务类型（例如："chat"、"transcription"）
 * @param provider 服务提供者（例如：Providers.OPENAI）
 * @returns 对应的服务实例
 */
export function getModelService(serviceType, provider) {
  const modelServiceConstructorMap = {
    chat: {
      [Providers.OPENAI]: OpenAIChatService,
      [Providers.GOOGLE]: GoogleGenerativeAIChatService,
      [Providers.CLOUDFLARE]: CloudflareWorkersAIChatService,
      [Providers.HUGGINGFACEHUB]: HuggingFaceInferenceChatService,
      [Providers.PORTKEY]: PortkeyChatService,
      [Providers.GLIDE]: GlideChatService,
    },
    transcription: {
      [Providers.OPENAI]: OpenAITranscriptionService,
      [Providers.CLOUDFLARE]: CloudflareWorkersAITranscriptionService,
    },
    imageEdit: {
      [Providers.CLOUDFLARE]: CloudflareWorkersAIImageEditService,
    },
    imageGeneration: {
      [Providers.OPENAI]: OpenAIImageGenerationService,
    },
    embedding: {
      [Providers.OPENAI]: OpenAIEmbeddingService,
      [Providers.GOOGLE]: GoogleGenerativeAIEmbeddingService,
      [Providers.CLOUDFLARE]: CloudflareWorkersAIEmbeddingService,
      [Providers.HUGGINGFACEHUB]: HuggingFaceInferenceEmbeddingService,
    },
  };

  const constructorMap = modelServiceConstructorMap[serviceType];
  if (!constructorMap) {
    throw new Error(`Unknown service type: ${serviceType}`);
  }

  const Constructor = constructorMap[provider];
  if (!Constructor) {
    throw new Error(
      `Unknown provider for service type ${serviceType}: ${provider}`,
    );
  }

  return new Constructor();
}

export function getExceptionHandling(provider: string): IExceptionHandling {
  switch (provider) {
    case Providers.OPENAI:
      return new OpenAIExceptionHandling();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
