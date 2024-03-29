import {
  BaseMessageChunk,
  Context,
  env,
  HuggingFaceInference,
  HuggingFaceInferenceEmbeddings,
  IterableReadableStream,
} from "../deps.ts";
import { ChatModelParams, EmbeddingParams } from "../types.ts";
import { AbstractChatService, AbstractEmbeddingService } from "../types/i_service.ts";

export class HuggingFaceInferenceChatService extends AbstractChatService {
  async executeModel(
    c: Context,
    params: ChatModelParams,
  ): Promise<string | BaseMessageChunk | IterableReadableStream> {
    const { baseURL, stop, modelName, ...rest } = params;
    const hfInput = {
      ...rest,
      endpointUrl: baseURL,
      stopSequences: stop,
      model: modelName,
    };
    const model = new HuggingFaceInference(hfInput);
    return params.streaming
      ? await model.stream(params.input)
      : await model.invoke(params.input);
  }
}

export class HuggingFaceInferenceEmbeddingService extends AbstractEmbeddingService {
  async executeModel(
    c: Context,
    params: EmbeddingParams,
  ): Promise<number[] | number[][]> {
    const hfInput = {
      ...params,
      model: params.modelName,
      endpointUrl: params.baseURL ||
        env<{ HUGGING_FACE_HUB_BASE_URL: string }>(
          c,
        )["HUGGING_FACE_HUB_BASE_URL"],
      apiKey: params.apiKey ||
        env<{ HUGGING_FACE_HUB_API_KEY: string }>(
          c,
        )["HUGGING_FACE_HUB_API_KEY"],
    };
    const embeddings = new HuggingFaceInferenceEmbeddings(hfInput);
    return Array.isArray(params.input)
      ? await embeddings.embedDocuments(params.input)
      : await embeddings.embedQuery(params.input);
  }
}
