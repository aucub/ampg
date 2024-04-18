import { Provider, Target, TaskType } from "../config.ts";
import { IExceptionHandling, IModelService } from "../types/i_service.ts";
import { schemas as openaiSchemas } from "../types/schemas/openai.ts";
import {
  CloudflareWorkersAIChatService,
  CloudflareWorkersAIEmbeddingService,
  CloudflareWorkersAIImageEditService,
  CloudflareWorkersAITranscriptionService
} from "./cloudflare_service.ts";
import {
  GoogleGenerativeAIChatService,
  GoogleGenerativeAIEmbeddingService,
} from "./google_genai_service.ts";
import {
  HuggingFaceInferenceEmbeddingService,
} from "./hf_service.ts";
import {
  OpenAIChatService,
  OpenAIEmbeddingService,
  OpenAIExceptionHandling,
  OpenAIImageGenerationService,
  OpenAITranscriptionService,
} from "./openai_service.ts";

export function getModelService(
  taskType: TaskType,
  provider: Provider,
): IModelService<any, any> {
  const modelServiceConstructorMap = {
    [TaskType.CHAT]: {
      [Provider.OPEN_AI]: OpenAIChatService,
      [Provider.GOOGLE]: GoogleGenerativeAIChatService,
      [Provider.WORKERS_AI]: CloudflareWorkersAIChatService,
    },
    [TaskType.EMBEDDINGS]: {
      [Provider.OPEN_AI]: OpenAIEmbeddingService,
      [Provider.GOOGLE]: GoogleGenerativeAIEmbeddingService,
      [Provider.HUGGINGFACE_INFERENCE]: HuggingFaceInferenceEmbeddingService,
      [Provider.WORKERS_AI]: CloudflareWorkersAIEmbeddingService,
    },
    [TaskType.AUDIO_TRANSCRIPTIONS]: {
      [Provider.OPEN_AI]: OpenAITranscriptionService,
      [Provider.WORKERS_AI]: CloudflareWorkersAITranscriptionService,
    },
    [TaskType.IMAGES_GENERATIONS]: {
      [Provider.OPEN_AI]: OpenAIImageGenerationService,
    },
    [TaskType.IMAGES_EDITS]: {
      [Provider.WORKERS_AI]: CloudflareWorkersAIImageEditService,
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
      [Provider.OPEN_AI]: {
        [Target.JSON]: openaiSchemas.CreateChatCompletionRequest,
      },
    },
    [TaskType.EMBEDDINGS]: {
      [Provider.OPEN_AI]: {
        [Target.JSON]: openaiSchemas.CreateEmbeddingRequest,
      },
    },
    [TaskType.IMAGES_GENERATIONS]: {
      [Provider.OPEN_AI]: {
        [Target.JSON]: openaiSchemas.CreateImageRequest,
      },
    },
    [TaskType.AUDIO_TRANSCRIPTIONS]: {
      [Provider.OPEN_AI]: {
        [Target.FORM]: openaiSchemas.CreateTranslationRequest,
      },
    },
    [TaskType.IMAGES_EDITS]: {
      [Provider.OPEN_AI]: {
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
    case Provider.OPEN_AI:
      return new OpenAIExceptionHandling();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
