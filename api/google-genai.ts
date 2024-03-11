import {
  BaseLanguageModelInput,
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIChatInput,
  GoogleGenerativeAIEmbeddings,
  GoogleGenerativeAIEmbeddingsParams,
} from "../deps.ts";
import { ChatModelParams, EmbeddingsParams } from "../types.ts";
import config, { googleGenaiModel } from "../config.ts";

export async function generateContentGoogleGenerative(
  params: ChatModelParams,
  chatHistory: BaseLanguageModelInput,
) {
  const ggai: GoogleGenerativeAIChatInput = {
    ...params,
  } as GoogleGenerativeAIChatInput;
  ggai["maxOutputTokens"] = params["maxTokens"];
  ggai["stopSequences"] = params["stop"];
  if (!googleGenaiModel.includes(ggai["modelName"] as string)) {
    ggai["modelName"] = null;
  }
  const model = new ChatGoogleGenerativeAI(ggai);
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
  if (!googleGenaiModel.includes(ggap["modelName"] as string)) {
    ggap["modelName"] = undefined;
  }
  const embeddings = new GoogleGenerativeAIEmbeddings(ggap);
  if (Array.isArray(texts)) {
    return await embeddings.embedDocuments(texts);
  } else {
    return await embeddings.embedQuery(texts);
  }
}
