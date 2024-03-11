import {
  BaseLanguageModelInput,
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIChatInput,
  GoogleGenerativeAIEmbeddings,
  GoogleGenerativeAIEmbeddingsParams,
} from "../deps.ts";
import { ChatModelParams, EmbeddingsParams } from "../types.ts";
import config from "../config.ts";

export async function generateContentGoogleGenerative(
  params: ChatModelParams,
  chatHistory: BaseLanguageModelInput,
) {
  const ggai: GoogleGenerativeAIChatInput = { ...params } as GoogleGenerativeAIChatInput;
  ggai["maxOutputTokens"] = params["maxTokens"];
  ggai["stopSequences"] = params["stop"];
  const model = await new ChatGoogleGenerativeAI(ggai);
  if (!params["streaming"]) {
    return await model.invoke(chatHistory);
  } else {
    return await model.stream(chatHistory);
  }
}

export async function generateEmbeddingsGoogleGenerative(
  params: EmbeddingsParams,
  texts: string[] | string,
) {
  let ggap: Partial<GoogleGenerativeAIEmbeddingsParams> = {};
  ggap = { ...ggap, ...params } as GoogleGenerativeAIEmbeddingsParams;
  ggap["apiKey"] = params["apiKey"] || config.googleApiKey;
  const embeddings = await new GoogleGenerativeAIEmbeddings(ggap);
  if (Array.isArray(texts)) {
    return await embeddings.embedDocuments(texts);
  } else {
    return await embeddings.embedQuery(texts);
  }
}
