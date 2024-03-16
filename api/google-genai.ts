import {
  BaseLanguageModelInput,
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIChatInput,
  GoogleGenerativeAIEmbeddings,
  GoogleGenerativeAIEmbeddingsParams,
} from "../deps.ts";
import { ChatModelParams, EmbeddingsParams } from "../types.ts";
import secretMap, { googleGenaiModel } from "../config.ts";

export async function generateContentGoogleGenerativeAI(
  params: ChatModelParams,
  chatHistory: BaseLanguageModelInput,
) {
  const googleGenerativeAIChatInput: GoogleGenerativeAIChatInput = {
    ...params,
  } as GoogleGenerativeAIChatInput;
  googleGenerativeAIChatInput["maxOutputTokens"] = params["maxTokens"];
  googleGenerativeAIChatInput["stopSequences"] = params["stop"];
  if (
    !googleGenaiModel.includes(
      googleGenerativeAIChatInput["modelName"] as string,
    )
  ) {
    googleGenerativeAIChatInput["modelName"] = undefined;
  }
  const model = new ChatGoogleGenerativeAI(googleGenerativeAIChatInput);
  if (!params["streaming"]) {
    return await model.invoke(chatHistory);
  } else {
    return await model.stream(chatHistory);
  }
}

export async function generateEmbeddingsGoogleGenerativeAI(
  params: EmbeddingsParams,
  texts: string[] | string,
) {
  const googleGenerativeAIEmbeddingsParams = params as Partial<
    GoogleGenerativeAIEmbeddingsParams
  >;
  googleGenerativeAIEmbeddingsParams["apiKey"] = params["apiKey"] ||
    secretMap.GOOGLE_API_KEY;
  if (
    !googleGenaiModel.includes(
      googleGenerativeAIEmbeddingsParams["modelName"] as string,
    )
  ) {
    googleGenerativeAIEmbeddingsParams["modelName"] = undefined;
  }
  const embeddings = new GoogleGenerativeAIEmbeddings(
    googleGenerativeAIEmbeddingsParams,
  );
  if (Array.isArray(texts)) {
    return await embeddings.embedDocuments(texts);
  } else {
    return await embeddings.embedQuery(texts);
  }
}
