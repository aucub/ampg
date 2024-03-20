import {
  AIMessage,
  AzureOpenAIInput,
  BaseChatModelParams,
  BaseLanguageModelInput,
  BaseMessage,
  BaseMessageLike,
  ChatOpenAI,
  ClientOptions,
  DallEAPIWrapper,
  HumanMessage,
  isBaseMessage,
  MessageContentComplex,
  OpenAIChatInput,
  OpenAIEmbeddings,
  OpenAIEmbeddingsParams,
  OpenAIWhisperAudio,
  SystemMessage,
  ToolInputParsingException,
  z,
} from "../deps.ts";
import {
  ChatModelParams,
  CreateImageParams,
  EmbeddingParams,
  ImageEditParams,
  LangException,
  openAIError,
  TranscriptionParams,
} from "../types.ts";
import { openAIChatModel, openAIEmbeddingModel } from "../config.ts";
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
          content["image_url"] = await urlToDataURL(
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
  formData: any | FormData,
  params: TranscriptionParams,
) {
  if (formData && typeof formData.get === "function") {
    params["file"] = formData.get("file") as File;
    params["modelName"] = formData.get("model");
    params["response_format"] = formData.get("response_format");
  } else {
    const {
      file,
      model,
      response_format,
    } = formData;
    params["file"] = file as File;
    params["modelName"] = model;
    params["response_format"] = response_format;
  }
  return params;
}

export function adaptImageEditRequestOpenAI(
  // deno-lint-ignore no-explicit-any
  formData: any,
  params: ImageEditParams,
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
  if (prompt) {
    params["prompt"] = prompt;
  }
  if (image) {
    params["image"] = image;
  }
  if (mask) {
    params["mask"] = mask;
  }
  if (model) {
    params["modelName"] = model;
  }
  if (n) {
    params["n"] = n;
  }
  if (size) {
    params["size"] = size;
  }
  if (response_format) {
    params["response_format"] = response_format;
  }
  if (user) {
    params["user"] = user;
  }
  return params;
}

export function adaptEmbeddingRequestOpenAI(
  body: z.infer<typeof openaiSchemas.CreateEmbeddingRequest>,
  params: EmbeddingParams,
) {
  params = { ...params, ...body } as EmbeddingParams;
  params["modelName"] = body["model"];
  const input = body["input"];
  return { params, input };
}

export async function embeddingOpenAI(
  params: EmbeddingParams,
  texts: string[] | string,
) {
  const openAIEmbeddingsParams: Partial<OpenAIEmbeddingsParams> & {
    verbose?: boolean;
    openAIApiKey?: string;
    configuration?: ClientOptions;
  } = { ...params };
  openAIEmbeddingsParams["openAIApiKey"] = params["apiKey"] ||
    Deno.env.get("OPENAI_API_KEY");
  if (!openAIEmbeddingsParams["configuration"]) {
    openAIEmbeddingsParams["configuration"] = { ...params } as ClientOptions;
  }
  openAIEmbeddingsParams["configuration"]["baseURL"] = params["baseURL"] ||
    Deno.env.get("OPENAI_BASE_URL");
  if (
    !openAIEmbeddingModel.includes(
      openAIEmbeddingsParams["modelName"] as string,
    )
  ) {
    openAIEmbeddingsParams["modelName"] = undefined;
  }
  const embeddings = new OpenAIEmbeddings(openAIEmbeddingsParams);
  if (Array.isArray(texts)) {
    return await embeddings.embedDocuments(texts);
  } else {
    return await embeddings.embedQuery(texts);
  }
}

export async function chatCompletionOpenAI(
  params: ChatModelParams,
  chatHistory: BaseLanguageModelInput,
) {
  let openAIChatInput:
    & Partial<OpenAIChatInput>
    & Partial<AzureOpenAIInput>
    & BaseChatModelParams
    & {
      configuration?: ClientOptions;
    } = {
      cache: params["cache"] || true,
    };
  openAIChatInput = { ...openAIChatInput, ...params };
  openAIChatInput["modelName"] = params["modelName"];
  openAIChatInput["openAIApiKey"] = params["apiKey"] ||
    Deno.env.get("OPENAI_API_KEY");
  if (!openAIChatModel.includes(openAIChatInput["modelName"] as string)) {
    openAIChatInput["modelName"] = undefined;
  }
  if (Deno.env.get("OPENAI_BASE_URL")) {
    openAIChatInput.configuration = openAIChatInput.configuration ?? {};
    openAIChatInput.configuration["baseURL"] = Deno.env.get("OPENAI_BASE_URL");
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

export async function transcriptionOpenAI(
  params: TranscriptionParams,
) {
  const loader = new OpenAIWhisperAudio(params["file"] as Blob, {
    clientOptions: params as ClientOptions,
  });
  const docs = await loader.load();
  const responseBody: z.infer<
    typeof openaiSchemas.CreateTranscriptionResponseJson
  > = {
    "text": docs.pageContent,
  };
  return responseBody;
}

export async function createImageOpenAI(
  params: CreateImageParams,
) {
  params["openAIApiKey"] = params["apiKey"] || Deno.env.get("OPENAI_API_KEY");
  params["responseFormat"] = params["response_format"];
  const tool = new DallEAPIWrapper(params);
  return await tool.invoke(params.prompt);
}

export function adaptChatCompletionResponseOpenAI(
  params: ChatModelParams,
  message: BaseMessage | string,
  // deno-lint-ignore no-explicit-any
): z.infer<typeof openaiSchemas.CreateChatCompletionResponse> | any {
  let content;
  if (typeof message === "string") {
    content = message;
  } else if (isBaseMessage(message)) {
    content = message.content.toString();
  }
  if (!params["streaming"]) {
    return {
      id: `chatcmpl-${Date.now()}`,
      choices: [
        {
          message: {
            "role": `assistant`,
            "content": content || null,
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
            "content": content || null,
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

export async function adaptImageResponseOpenAI(
  image: Blob | string,
  params: CreateImageParams | ImageEditParams,
) {
  if (params.response_format == "url" && typeof image == "string") {
    return {
      "created": Math.floor(Date.now() / 1000),
      "data": [
        {
          "url": image,
        },
      ],
    };
  }
  if (image instanceof Blob) {
    return {
      created: Math.floor(Date.now() / 1000),
      data: [
        {
          b64_json: await blobToBase64(image),
        },
      ],
    };
  }
}

export function adaptEmbeddingResponseOpenAI(
  params: EmbeddingParams,
  embedding: number[] | number[][],
  // deno-lint-ignore no-explicit-any
): z.infer<typeof openaiSchemas.CreateEmbeddingResponse> | any {
  let data;
  if (Array.isArray(embedding[0])) {
    if (typeof embedding[0][0] == "number") {
      data = embedding.map((embeddingArray, index) => ({
        object: "embedding",
        embedding: embeddingArray,
        index: index,
      }));
    }
  } else {
    data = {
      object: "embedding",
      embedding: embedding,
      index: 0,
    };
  }
  return {
    "object": "list",
    "data": data,
    "model": params["modelName"] || "unknown",
  };
}

export function adaptErrorResponseOpenAI(
  exception: LangException,
) {
  const error: openAIError = {
    code: null,
    message: "",
    param: null,
    type: "",
  };
  error.message = exception.message;
  if (exception.llmOutput) {
    error.type = "llm";
    error.param = JSON.stringify({
      llmOutput: exception.llmOutput,
      observation: exception.observation,
    });
  } else if (exception.toolOutput) {
    error.type = "tool";
    error.param = exception.toolOutput;
  }
  return new Response(JSON.stringify(error), {
    status: 500,
  });
}

async function urlToDataURL(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ToolInputParsingException("Failed to download.");
  }
  const blob = await response.blob();
  return await blobToDataURL(blob);
}

async function blobToDataURL(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function blobToBase64(blob: Blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binaryString = "";
  for (let i = 0; i < uint8Array.byteLength; i += 1024) {
    const chunk = uint8Array.subarray(
      i,
      Math.min(i + 1024, uint8Array.byteLength),
    );
    binaryString += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binaryString);
}
