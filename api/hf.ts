import {
  BaseLanguageModelInput,
  HuggingFaceInference,
  HuggingFaceInferenceEmbeddings,
} from "../deps.ts";
import { ChatModelParams, EmbeddingParams } from "../types.ts";

export async function textGenerationInferenceHuggingFace(
  params: ChatModelParams,
  chatHistory: BaseLanguageModelInput,
) {
  const hfInput = params;
  hfInput["endpointUrl"] = params["baseURL"];
  hfInput["stopSequences"] = params["stop"];
  hfInput["model"] = params["modelName"];
  const model = new HuggingFaceInference(hfInput);
  if (!params["streaming"]) {
    return await model.invoke(chatHistory);
  } else {
    return await model.stream(chatHistory);
  }
}

export async function textEmbeddingsInferenceHuggingFace(
  params: EmbeddingParams,
  texts: string[] | string,
) {
  const huggingFaceInferenceEmbeddingsParams = params;
  if (params["modelName"]) {
    huggingFaceInferenceEmbeddingsParams["model"] = params["modelName"];
  }
  if (params["baseURL"] || Deno.env.get("HUGGINGFACEHUB_BASE_URL")) {
    huggingFaceInferenceEmbeddingsParams["endpointUrl"] = params["baseURL"] ||
      Deno.env.get("HUGGINGFACEHUB_BASE_URL");
  }
  huggingFaceInferenceEmbeddingsParams["apiKey"] = params["apiKey"] ||
    Deno.env.get("HUGGINGFACEHUB_API_KEY");
  const embeddings = new HuggingFaceInferenceEmbeddings(
    huggingFaceInferenceEmbeddingsParams,
  );
  if (Array.isArray(texts)) {
    return await embeddings.embedDocuments(texts);
  } else {
    return await embeddings.embedQuery(texts);
  }
}
