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
  OpenAIWhisperAudio,
  SystemMessage,
  z,
  AzureOpenAIInput,
  ToolInputParsingException,
} from "../deps.ts";
import {
  ChatModelParams,
  ImagesEditsParams,
  EmbeddingsParams,
  TranscriptionParams,
  LangException,
  openAIError
} from "../types.ts";
import secretMap, { openAIChatModel, openAIEmbeddingModel } from "../config.ts";
import { schemas as openaiSchemas } from "../types/openai.ts";

export async function adaptChatCompletionRequestOpenAI(
  body: z.infer<typeof openaiSchemas.CreateChatCompletionRequest>,
  params: ChatModelParams,
) {
  params = { ...params, ...body } as ChatModelParams;
  if (body["model"] && !params["modelName"]) {
    params["modelName"] = body["model"];
  }
  params["streaming"] = body["stream"] || false;
  params["topP"] = body["top_p"] || undefined;
  params["maxTokens"] = body["max_tokens"] || undefined;
  const chatHistory: BaseMessageLike[] = [];
  for (let i = 0; i < body["messages"].length; i++) {
    const message = body["messages"][i];
    let messageContent;
    if (typeof message["content"] != "string") {
      messageContent = message["content"] as MessageContentComplex[];
      for await (const content of messageContent) {
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

export function adaptTranscriptionRequestOpenAI(
  // deno-lint-ignore no-explicit-any
  formData: any,
  params: TranscriptionParams,
) {
  const {
    file,
    model,
    response_format,
  } = formData;
  params["file"] = file;
  params["modelName"] = model;
  params["response_format"] = response_format;
  return params;
}

export function adaptImagesEditsRequestOpenAI(
  // deno-lint-ignore no-explicit-any
  formData: any,
  params: ImagesEditsParams,
) {
  const {
    prompt,
    image,
    mask,
    model,
    n,
    size,
    response_format,
    user,
  } = formData;
  params["prompt"] = prompt;
  params["image"] = image;
  params["mask"] = mask;
  params["modelName"] = model;
  params["n"] = n;
  params["size"] = size;
  params["response_format"] = response_format;
  if (user) {
    params["user"] = user;
  }
  return params;
}

export function adaptEmbeddingsRequestOpenAI(
  body: z.infer<typeof openaiSchemas.CreateEmbeddingRequest>,
  params: EmbeddingsParams,
) {
  params = { ...params, ...body } as EmbeddingsParams;
  params["modelName"] = body["model"];
  const input = body["input"];
  return { params, input };
}

export async function generateEmbeddingsOpenAI(
  params: EmbeddingsParams,
  texts: string[] | string,
) {
  const openAIEmbeddingsParams: Partial<OpenAIEmbeddingsParams> & {
    verbose?: boolean;
    openAIApiKey?: string;
    configuration?: ClientOptions;
  } = { ...params };
  openAIEmbeddingsParams["openAIApiKey"] = params["apiKey"] || secretMap.OPENAI_API_KEY;
  if (!openAIEmbeddingsParams["configuration"]) {
    openAIEmbeddingsParams["configuration"] = { ...params } as ClientOptions;
  }
  openAIEmbeddingsParams["configuration"]["baseURL"] = params["baseURL"] ||
    secretMap.OPENAI_BASE_URL;
  if (!openAIEmbeddingModel.includes(openAIEmbeddingsParams["modelName"] as string)) {
    openAIEmbeddingsParams["modelName"] = undefined;
  }
  const embeddings = new OpenAIEmbeddings(openAIEmbeddingsParams);
  if (Array.isArray(texts)) {
    return await embeddings.embedDocuments(texts);
  } else {
    return await embeddings.embedQuery(texts);
  }
}

export async function generateChatCompletionOpenAI(
  params: ChatModelParams,
  chatHistory: BaseLanguageModelInput,
) {
  let openAIChatInput: Partial<OpenAIChatInput> & Partial<AzureOpenAIInput> & BaseChatModelParams = {
    cache: params["cache"] || true,
  };
  openAIChatInput = { ...openAIChatInput, ...params };
  openAIChatInput["modelName"] = params["modelName"];
  openAIChatInput["openAIApiKey"] = params["apiKey"] || secretMap.OPENAI_API_KEY;
  if (!openAIChatModel.includes(openAIChatInput["modelName"] as string)) {
    openAIChatInput["modelName"] = undefined;
  }
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  const model = new ChatOpenAI(openAIChatInput);
  if (!params["streaming"]) {
    return await model.invoke(chatHistory);
  } else {
    return await model.stream(chatHistory);
  }
}

export async function generateTranscriptionOpenAI(
  params: TranscriptionParams,
) {
  const loader = new OpenAIWhisperAudio(params["file"] as Blob, {
    clientOptions: params as ClientOptions,
  });
  return await loader.load();
}

export function adaptChatCompletionResponseOpenAI(
  params: ChatModelParams,
  message: BaseMessage | string,
  // deno-lint-ignore no-explicit-any
): z.infer<typeof openaiSchemas.CreateChatCompletionResponse> | any {
  let text;
  if (typeof message === "string") {
    text = message;
  } else if (message instanceof BaseMessage) {
    text = message.content.toString();
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
      model: params["modelName"] || "unknown",
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
      model: params["modelName"] || "unknown",
      object: "chat.completion.chunk",
    };
  }
}

export async function adaptImagesEditsResponseOpenAI(blob: Blob) {
  return {
    created: Math.floor(Date.now() / 1000),
    data: [
      {
        b64_json: await convertImageToBase64Json(blob),
      },
    ],
  };
}

export function adaptEmbeddingsResponseOpenAI(
  params: EmbeddingsParams,
  embeddings: number[] | number[][],
  // deno-lint-ignore no-explicit-any
): z.infer<typeof openaiSchemas.CreateEmbeddingResponse> | any {
  let embeddingsData;
  if (Array.isArray(embeddings[0])) {
    if (typeof embeddings[0][0] == "number") {
      embeddingsData = embeddings.map((embeddingArray, index) => ({
        object: "embedding",
        embedding: embeddingArray,
        index: index,
      }));
    }
  } else {
    embeddingsData = {
      object: "embedding",
      embedding: embeddings,
      index: 0,
    };
  }
  return {
    "object": "list",
    "data": embeddingsData,
    "model": params["modelName"] || "unknown",
  };
}


export function adaptErrorResponseOpenAI(
  err: LangException
) {
  const error: openAIError = {
    code: null,
    message: "",
    param: null,
    type: ""
  };
  error.message = JSON.stringify(err);
  if (err.llmOutput) {
    error.type = 'llm';
  } else if (err.toolOutput) {
    error.type = 'tool';
  }
  return new Response(JSON.stringify(error), {
    status: 500,
  });
}

async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ToolInputParsingException("Failed to download image.");
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

async function convertImageToBase64Json(blob: Blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binaryString = "";
  for (let i = 0; i < uint8Array.byteLength; i += 1024) {
    const chunk = uint8Array.subarray(
      i,
      Math.min(i + 1024, uint8Array.byteLength)
    );
    binaryString += String.fromCharCode.apply(null, Array.from(chunk));
  }
  const base64String = btoa(binaryString);
  const json = {
    image: base64String,
    contentType: blob.type,
  };
  return JSON.stringify(json);
}
