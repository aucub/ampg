import { IExceptionHandling } from "../types/i_service.ts";
import {
  cloudflareWorkersAIModel,
  googleGenaiModel,
  openAIModel,
  Provider,
  TaskType,
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

function getProviderByModelName(modelName: string): Provider | undefined {
  if (openAIModel.includes(modelName)) {
    return Provider.OPENAI;
  } else if (googleGenaiModel.includes(modelName)) {
    return Provider.GOOGLE;
  } else if (cloudflareWorkersAIModel.includes(modelName)) {
    return Provider.CLOUDFLARE;
  }
  return undefined;
}

export function assignProvider(params: BaseModelParams): BaseModelParams {
  const { provider, modelName } = params;

  if (
    !provider ||
    !Object.values(Provider).includes(params["provider"] as Provider)
  ) {
    params.provider = modelName ? getProviderByModelName(modelName) : undefined;
  }

  return params;
}

/**
 * 获取服务实例的通用函数。
 *
 * @param taskType 任务类型（例如：TaskType.CHAT）
 * @param provider 服务提供者（例如：Providers.OPENAI）
 * @returns 对应的服务实例
 */
export function getModelService(taskType: TaskType, provider: Provider) {
  const modelServiceConstructorMap = {
    [TaskType.CHAT]: {
      [Provider.OPENAI]: OpenAIChatService,
      [Provider.GOOGLE]: GoogleGenerativeAIChatService,
      [Provider.CLOUDFLARE]: CloudflareWorkersAIChatService,
      [Provider.HUGGINGFACEHUB]: HuggingFaceInferenceChatService,
      [Provider.PORTKEY]: PortkeyChatService,
      [Provider.GLIDE]: GlideChatService,
    },
    [TaskType.EMBEDDINGS]: {
      [Provider.OPENAI]: OpenAIEmbeddingService,
      [Provider.GOOGLE]: GoogleGenerativeAIEmbeddingService,
      [Provider.CLOUDFLARE]: CloudflareWorkersAIEmbeddingService,
      [Provider.HUGGINGFACEHUB]: HuggingFaceInferenceEmbeddingService,
    },
    [TaskType.AUDIO_TRANSCRIPTIONS]: {
      [Provider.OPENAI]: OpenAITranscriptionService,
      [Provider.CLOUDFLARE]: CloudflareWorkersAITranscriptionService,
    },
    [TaskType.IMAGES_EDITS]: {
      [Provider.CLOUDFLARE]: CloudflareWorkersAIImageEditService,
    },
    [TaskType.IMAGES_GENERATIONS]: {
      [Provider.OPENAI]: OpenAIImageGenerationService,
    },
  };

  const constructorMap = modelServiceConstructorMap[taskType];
  if (!constructorMap) {
    throw new Error(`Unknown service type: ${taskType}`);
  }

  const Constructor = constructorMap[provider];
  if (!Constructor) {
    throw new Error(
      `Unknown provider for service type ${taskType}: ${provider}`,
    );
  }

  return new Constructor();
}

export function getExceptionHandling(provider: string): IExceptionHandling {
  switch (provider) {
    case Provider.OPENAI:
      return new OpenAIExceptionHandling();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
