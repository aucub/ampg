import {
  BaseMessageChunk,
  ChatGoogleGenerativeAI,
  Context,
  env,
  GoogleGenerativeAIChatInput,
  GoogleGenerativeAIEmbeddings,
  GoogleGenerativeAIEmbeddingsParams,
  HarmBlockThreshold,
  HarmCategory,
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
      baseUrl: "https://generativelanguage.googleapis.com",
      apiVersion: "v1beta",
      ...params,
      maxOutputTokens: params.maxTokens,
      apiKey: params.apiKey ||
        env<{ GOOGLE_API_KEY: string }>(c)["GOOGLE_API_KEY"],
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    };
    const model = new ChatGoogleGenerativeAI(googleGenerativeAIChatInput);
    // @ts-ignore
    return googleGenerativeAIChatInput.streaming
      ? await model.stream(params.input)
      : await model.invoke(params.input);
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
