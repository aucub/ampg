import { Provider, Target, TaskType } from "../config.ts";
import { IExceptionHandling, IModelService } from "../types/i_service.ts";
import { CloudflareWorkersAIChatService } from "./cloudflare_service.ts";
import {
  GoogleGenerativeAIChatService,
  GoogleGenerativeAIEmbeddingService,
} from "./google_genai_service.ts";
import { HuggingFaceInferenceEmbeddingService } from "./hf_service.ts";
import {
  OpenAIChatService,
  OpenAIEmbeddingService,
  OpenAIExceptionHandling,
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

export function getExceptionHandling(provider: Provider): IExceptionHandling {
  switch (provider) {
    case Provider.OPEN_AI:
      return new OpenAIExceptionHandling();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
