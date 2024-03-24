import {
  ChatGoogleGenerativeAI,
  Context,
  GoogleGenerativeAIChatInput,
  GoogleGenerativeAIEmbeddings,
  GoogleGenerativeAIEmbeddingsParams,
} from "../deps.ts";
import { googleGenaiModel } from "../config.ts";
import { ChatModelParams, EmbeddingParams } from '../types.ts';
import { IChatService, IEmbeddingService } from '../types/i_service.ts'

export class GoogleGenerativeAIChatService implements IChatService {
  prepareModelParams(c: Context): Promise<ChatModelParams> {
    throw new Error("Method not implemented.");
  }
  async executeModel(c: Context, params: ChatModelParams): Promise<any> {
    const googleGenerativeAIChatInput: GoogleGenerativeAIChatInput = {
      ...params,
      maxOutputTokens: params.maxTokens,
      stopSequences: params.stop,
      modelName: googleGenaiModel.includes(params.modelName ?? "") ? params.modelName : undefined,
    };

    const model = new ChatGoogleGenerativeAI(googleGenerativeAIChatInput);

    if (!params.streaming) {
      return await model.invoke(params.input);
    } else {
      return await model.stream(params.input);
    }
  }
  deliverOutput(c: Context, output: any): Promise<Response> {
    throw new Error("Method not implemented.");
  }
}

export class GoogleGenerativeAIEmbeddingService implements IEmbeddingService {
  prepareModelParams(c: Context): Promise<EmbeddingParams> {
    throw new Error("Method not implemented.");
  }
  async executeModel(c: Context, params: EmbeddingParams): Promise<number[] | number[][]> {
    const googleGenerativeAIEmbeddingsParams: GoogleGenerativeAIEmbeddingsParams = {
      ...params,
      apiKey: params.apiKey || c.env.GOOGLE_API_KEY,
    };
    if (!googleGenaiModel.includes(params.modelName ?? "")) {
      googleGenerativeAIEmbeddingsParams.modelName = undefined;
    }
    const embeddings = new GoogleGenerativeAIEmbeddings(googleGenerativeAIEmbeddingsParams);
    if (Array.isArray(params.input)) {
      return await embeddings.embedDocuments(params.input);
    } else {
      return await embeddings.embedQuery(params.input);
    }
  }
  deliverOutput(c: Context, output: number[] | number[][]): Promise<Response> {
    throw new Error("Method not implemented.");
  }
}