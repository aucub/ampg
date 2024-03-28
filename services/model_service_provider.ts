import { IExceptionHandling } from "../types/i_service.ts";
import {
  cloudflareWorkersAIModel,
  googleGenaiModel,
  openAIModel,
  Provider,
  Target,
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
import { schemas as openaiSchemas } from "../types/schemas/openai.ts";
import {
  HuggingFaceInferenceChatService,
  HuggingFaceInferenceEmbeddingService,
} from "./hf_service.ts";
import { PortkeyChatService } from "./portkey_service.ts";
import { GlideChatService } from "./glide_service.ts";

export function getProviderByModelName(modelName: string): Provider | undefined {
  if (openAIModel.includes(modelName)) {
    return Provider.OPENAI;
  } else if (googleGenaiModel.includes(modelName)) {
    return Provider.GOOGLE;
  } else if (cloudflareWorkersAIModel.includes(modelName)) {
    return Provider.CLOUDFLARE;
  }
  return undefined;
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

export function getZodValidatorSchema(target: Target, taskType: TaskType, provider: Provider) {
  const zodValidatorModelRequestMap = {
    [Target.JSON]: {
      [TaskType.CHAT]: {
        [Provider.OPENAI]: openaiSchemas.CreateChatCompletionRequest,
      },
      [TaskType.EMBEDDINGS]: {
        [Provider.OPENAI]: openaiSchemas.CreateEmbeddingRequest,
      },
      [TaskType.IMAGES_GENERATIONS]: {
        [Provider.OPENAI]: openaiSchemas.CreateImageRequest,
      },
    },
    [Target.FORM]: {
      [TaskType.AUDIO_TRANSCRIPTIONS]: {
        [Provider.OPENAI]: openaiSchemas.CreateTranslationRequest,
      },
      [TaskType.IMAGES_EDITS]: {
        [Provider.OPENAI]: openaiSchemas.CreateImageEditRequest,
      },
    },
  };

  const targetMap = zodValidatorModelRequestMap[target];
  if (!targetMap) {
    throw new Error(`Unknown target: ${targetMap}`);
  }

  const taskMap = targetMap[taskType];
  if (!taskMap) {
    throw new Error(`Unknown type ${targetMap}: ${taskMap}`);
  }

  const schema = taskMap[provider];
  if (!schema) {
    throw new Error(`Unknown provider ${targetMap}: ${taskMap}: ${provider}`);
  }

  return schema;
}

export function getExceptionHandling(provider: Provider): IExceptionHandling {
  switch (provider) {
    case Provider.OPENAI:
      return new OpenAIExceptionHandling();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
