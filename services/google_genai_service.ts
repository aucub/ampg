import {
  BaseMessageChunk,
  ChatGoogleGenerativeAI,
  Context,
  env,
  GoogleGenerativeAIChatInput,
  GoogleGenerativeAIEmbeddings,
  GoogleGenerativeAIEmbeddingsParams,
  IterableReadableStream,
} from "../deps.ts";
import { ChatModelParams, EmbeddingParams } from "../types.ts";
import {
  AbstractChatService,
  AbstractEmbeddingService,
} from "../types/i_service.ts";

export class GoogleGenerativeAIChatService extends AbstractChatService {
  async executeModel(
    c: Context,
    params: ChatModelParams,
  ): Promise<string | BaseMessageChunk | IterableReadableStream<any>> {
    const googleGenerativeAIChatInput: GoogleGenerativeAIChatInput = {
      ...params,
      maxOutputTokens: params.maxTokens,
      stopSequences: params.stop,
      apiKey: params.apiKey ||
        env<{ GOOGLE_API_KEY: string }>(c)["GOOGLE_API_KEY"],
    };
    const model = new ChatGoogleGenerativeAI(googleGenerativeAIChatInput);
    return await model.invoke(params.input);
  }
}

export class GoogleGenerativeAIEmbeddingService
  extends AbstractEmbeddingService {
  async executeModel(
    c: Context,
    params: EmbeddingParams,
  ): Promise<number[] | number[][]> {
    const googleGenerativeAIEmbeddingsParams:
      GoogleGenerativeAIEmbeddingsParams = {
      ...params,
      apiKey: params.apiKey ||
        env<{ GOOGLE_API_KEY: string }>(c)["GOOGLE_API_KEY"],
    };
    const embeddings = new GoogleGenerativeAIEmbeddings(
      googleGenerativeAIEmbeddingsParams,
    );
    if (Array.isArray(params.input)) {
      return await embeddings.embedDocuments(params.input);
    } else {
      return await embeddings.embedQuery(params.input);
    }
  }
}
