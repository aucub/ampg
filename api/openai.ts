import {
  AIMessage,
  BaseChatModelParams,
  BaseLanguageModelInput,
  BaseMessage,
  BaseMessageLike,
  ChatOpenAI,
  ClientOptions,
  HumanMessage,
  MessageContentComplex,
  OpenAIChatInput,
  OpenAIEmbeddings,
  OpenAIEmbeddingsParams,
  SystemMessage,
  z,
} from "../deps.ts";
import { ChatModelParams, EmbeddingsParams } from "../types.ts";
import config, { openAIChatModel, openAIEmbeddingModel } from "../config.ts";
import { schemas as openaiSchemas } from "../types/openai.ts";
export async function parseOpenAiChatRequest(
  data: z.infer<typeof openaiSchemas.CreateChatCompletionRequest>,
  params: ChatModelParams,
) {
  params = { ...params, ...data } as ChatModelParams;
  params["modelName"] = data["model"];
  params["streaming"] = data["stream"] || false;
  params["topP"] = data["top_p"] || undefined;
  params["maxTokens"] = data["max_tokens"] || undefined;
  const chatHistory: BaseMessageLike[] = [];
  for (let i = 0; i < data["messages"].length; i++) {
    const message = data["messages"][i];
    let messageContent;
    if (typeof message["content"] != "string") {
      messageContent = message["content"] as MessageContentComplex[];
      for (const content of messageContent) {
        if (
          content["type"] == "image_url" &&
          typeof (content["image_url"] as { url: string })["url"] ===
            "string" &&
          (content["image_url"] as { url: string })["url"].startsWith("http")
        ) {
          (content["image_url"] as { url: string })["url"] = await urlToBase64(
            (content["image_url"] as { url: string })["url"],
          );
        }
      }
    } else {
      messageContent = message["content"];
    }
    if (message["role"] == "system") {
      chatHistory.push(new SystemMessage(message["content"]));
    } else if (message["role"] == "user") {
      chatHistory.push(
        new HumanMessage({
          content: messageContent,
        }),
      );
    } else if (message["role"] == "assistant") {
      chatHistory.push(new AIMessage(message["content"] as string));
    }
  }
  return { params, chatHistory };
}

export function parseOpenAiEmbeddingsRequest(
  data: z.infer<typeof openaiSchemas.CreateEmbeddingRequest>,
  params: EmbeddingsParams,
) {
  params = { ...params, ...data } as EmbeddingsParams;
  params["modelName"] = data["model"];
  const input = data["input"];
  return { params, input };
}

export async function generateOpenAIEmbeddings(
  params: ChatModelParams,
  texts: string[] | string,
) {
  const oaep: Partial<OpenAIEmbeddingsParams> & {
    verbose?: boolean;
    openAIApiKey?: string;
    configuration?: ClientOptions;
  } = { ...params };
  oaep["openAIApiKey"] = params["apiKey"] || config.openaiApiKey;
  if (oaep["configuration"] == undefined) {
    oaep["configuration"] = { ...params } as ClientOptions;
  }
  oaep["configuration"]["baseURL"] = params["baseURL"] || config.openaiBaseUrl;
  if (!openAIEmbeddingModel.includes(oaep["modelName"] as string)) {
    oaep["modelName"] = undefined;
  }
  const embeddings = new OpenAIEmbeddings(oaep);
  if (Array.isArray(texts)) {
    return await embeddings.embedDocuments(texts);
  } else {
    return await embeddings.embedQuery(texts);
  }
}

export async function generateOpenAIChatCompletion(
  params: ChatModelParams,
  chatHistory: BaseLanguageModelInput,
) {
  let oaci: Partial<OpenAIChatInput> & BaseChatModelParams & {
    configuration: Partial<ClientOptions>;
  } = {
    configuration: {},
    cache: params["cache"] || true,
  };
  oaci = { ...oaci, ...params };
  oaci["modelName"] = params["modelName"];
  oaci["openAIApiKey"] = params["apiKey"] || config.openaiApiKey;
  oaci["configuration"]["baseURL"] = params["baseURL"] || config.openaiBaseUrl;
  if (!openAIChatModel.includes(oaci["modelName"] as string)) {
    oaci["modelName"] = undefined;
  }
  const model = new ChatOpenAI(oaci);
  if (!params["streaming"]) {
    return await model.invoke(chatHistory);
  } else {
    return await model.stream(chatHistory);
  }
}

export function adaptOpenAIChatResponse(
  params: ChatModelParams,
  data: BaseMessage | string,
  // deno-lint-ignore no-explicit-any
): z.infer<typeof openaiSchemas.CreateChatCompletionResponse> | any {
  let text;
  if (typeof data === "string") {
    text = data;
  } else if (data instanceof BaseMessage) {
    text = data.content.toString();
  }
  if (!params["streaming"]) {
    return {
      id: `chatcmpl-${Date.now()}`,
      choices: [
        {
          message: {
            "role": `assistant`,
            "content": text || null,
          },
          finish_reason: "length",
          index: 0,
          logprobs: null,
        },
      ],
      created: Math.floor(Date.now() / 1000),
      model: params["modelName"] || "unkown",
      object: "chat.completion",
    };
  } else {
    return {
      id: `chatcmpl-${Date.now()}`,
      choices: [
        {
          delta: {
            "role": `assistant`,
            "content": text || null,
          },
          finish_reason: "length",
          index: 0,
          logprobs: null,
        },
      ],
      created: Math.floor(Date.now() / 1000),
      model: params["modelName"] || "unkown",
      object: "chat.completion.chunk",
    };
  }
}

export function adaptOpenAIEmbeddingsResponse(
  params: EmbeddingsParams,
  data: number[] | number[][],
  // deno-lint-ignore no-explicit-any
): z.infer<typeof openaiSchemas.CreateEmbeddingResponse> | any {
  let embeddingData;
  if (Array.isArray(data[0])) {
    if (typeof data[0][0] == "number") {
      embeddingData = data.map((embeddingArray, index) => ({
        object: "embedding",
        embedding: embeddingArray,
        index: index,
      }));
    }
  } else {
    embeddingData = {
      object: "embedding",
      embedding: data,
      index: 0,
    };
  }
  return {
    "object": "list",
    "data": embeddingData,
    "model": params["modelName"] || "unkown",
  };
}

async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to download image.");
  }
  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  const type = blob.type;
  const base64String = btoa(
    new Uint8Array(buffer)
      .reduce((data, byte) => data + String.fromCharCode(byte), ""),
  );
  return `data:${type};base64,${base64String}`;
}
