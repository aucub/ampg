import { IExceptionHandling } from "../types/i_service.ts";
import { Provider, Target, TaskType } from "../config.ts";
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

export function getZodValidatorSchema(
  taskType: TaskType,
  provider: Provider,
  target: Target,
) {
  const zodValidatorModelRequestMap = {
    [TaskType.CHAT]: {
      [Provider.OPENAI]: {
        [Target.JSON]: openaiSchemas.CreateChatCompletionRequest,
      },
    },
    [TaskType.EMBEDDINGS]: {
      [Provider.OPENAI]: {
        [Target.JSON]: openaiSchemas.CreateEmbeddingRequest,
      },
    },
    [TaskType.IMAGES_GENERATIONS]: {
      [Provider.OPENAI]: {
        [Target.JSON]: openaiSchemas.CreateImageRequest,
      },
    },
    [TaskType.AUDIO_TRANSCRIPTIONS]: {
      [Provider.OPENAI]: {
        [Target.FORM]: openaiSchemas.CreateTranslationRequest,
      },
    },
    [TaskType.IMAGES_EDITS]: {
      [Provider.OPENAI]: {
        [Target.FORM]: openaiSchemas.CreateImageEditRequest,
      },
    },
  };
  try {
    const schema = zodValidatorModelRequestMap[taskType][provider][target];
    return schema;
  } catch (error) {
    return null;
  }
}

export function getExceptionHandling(provider: Provider): IExceptionHandling {
  switch (provider) {
    case Provider.OPENAI:
      return new OpenAIExceptionHandling();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
