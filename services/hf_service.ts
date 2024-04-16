import {
  Context,
  env,
  HuggingFaceInferenceEmbeddings,
} from "../deps.ts";
import { EmbeddingParams } from "../types.ts";
import {
  AbstractEmbeddingService,
} from "../types/i_service.ts";

export class HuggingFaceInferenceEmbeddingService
  extends AbstractEmbeddingService {
  async executeModel(
    c: Context,
    params: EmbeddingParams,
  ): Promise<number[] | number[][]> {
    const hfInput = {
      ...params,
      endpointUrl: params.baseURL ||
        env<{ HUGGINGFACEHUB_BASE_URL: string }>(
          c,
        )["HUGGINGFACEHUB_BASE_URL"],
      apiKey: params.apiKey ||
        env<{ HUGGINGFACEHUB_API_KEY: string }>(
          c,
        )["HUGGINGFACEHUB_API_KEY"],
    };
    const embeddings = new HuggingFaceInferenceEmbeddings(hfInput);
    return Array.isArray(params.input)
      ? await embeddings.embedDocuments(params.input)
      : await embeddings.embedQuery(params.input);
  }
}
