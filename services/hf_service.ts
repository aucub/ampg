import {
  Context,
  HuggingFaceInference,
  HuggingFaceInferenceEmbeddings,
  env,
} from "../deps.ts";
import { ChatModelParams, EmbeddingParams } from "../types.ts";
import { IChatService, IEmbeddingService } from "../types/i_service.ts";

export class HuggingFaceInferenceChatService implements IChatService {
  prepareModelParams(c: Context): Promise<ChatModelParams> {
    throw new Error("Method not implemented.");
  }
  async executeModel(c: Context, params: ChatModelParams): Promise<any> {
    const { baseURL, stop, modelName, ...rest } = params;
    const hfInput = {
      endpointUrl: baseURL,
      stopSequences: stop,
      model: modelName,
      ...rest
    };
    const model = new HuggingFaceInference(hfInput);
    return params.streaming ? await model.stream(params.input) : await model.invoke(params.input);
  }
  deliverOutput(c: Context, output: any): Promise<Response> {
    throw new Error("Method not implemented.");
  }

}

export class HuggingFaceInferenceEmbeddingService implements IEmbeddingService {
  prepareModelParams(c: Context): Promise<EmbeddingParams> {
    throw new Error("Method not implemented.");
  }
  async executeModel(c: Context, params: EmbeddingParams): Promise<number[] | number[][]> {
    const hfInput = {
      ...params,
      model: params.modelName,
      endpointUrl: params.baseURL || env<{ HUGGING_FACE_HUB_BASE_URL: string }>(c)['HUGGING_FACE_HUB_BASE_URL'],
      apiKey: params.apiKey || env<{ HUGGING_FACE_HUB_API_KEY: string }>(c)['HUGGING_FACE_HUB_API_KEY'],
    };
    const embeddings = new HuggingFaceInferenceEmbeddings(hfInput);
    return Array.isArray(params.input) ? await embeddings.embedDocuments(params.input) : await embeddings.embedQuery(params.input);
  }

  deliverOutput(c: Context, output: number[] | number[][]): Promise<Response> {
    throw new Error("Method not implemented.");
  }
}
