import {
  AIMessage,
  BaseChatModelParams,
  BaseFunctionCallOptions,
  BaseMessage,
  BaseMessageChunk,
  BaseMessageLike,
  ChatOpenAI,
  ClientOptions,
  Context,
  DallEAPIWrapper,
  Document,
  env,
  HumanMessage,
  isBaseMessage,
  isBaseMessageChunk,
  IterableReadableStream,
  OpenAIChatInput,
  OpenAIEmbeddings,
  OpenAIEmbeddingsParams,
  OpenAIWhisperAudio,
  streamSSE,
  SystemMessage,
  z,
} from "../deps.ts";
import {
  blobToBase64,
  isChatCompletionNamedToolChoice,
  isIterableReadableStream,
  urlToDataURL,
} from "../helpers/util.ts";
import {
  ChatModelParams,
  EmbeddingParams,
  ImageEditParams,
  ImageGenerationParams,
  LangException,
  OpenAIError,
  TranscriptionParams,
} from "../types.ts";
import {
  AbstractAudioTranscriptionService,
  AbstractChatService,
  AbstractEmbeddingService,
  AbstractImageEditService,
  AbstractImageGenerationService,
  IExceptionHandling,
} from "../types/i_service.ts";
import { schemas as openaiSchemas } from "../types/schemas/openai.ts";

export class OpenAIChatService extends AbstractChatService {
  async prepareModelParams(c: Context): Promise<ChatModelParams> {
    const params: Partial<ChatModelParams> = await c.get("params") ?? {};
    // @ts-ignore
    const body: z.infer<typeof openaiSchemas.CreateChatCompletionRequest> =
      // @ts-ignore
      await c.req.valid("json");
    if (body.stop) {
      if (typeof body.stop === "string") {
        body.stopSequences = [body.stop];
      } else {
        body.stopSequences = body.stop;
      }
    }
    // @ts-ignore
    let mergedParams: ChatModelParams = {
      ...params,
      ...body,
      model: params["model"] || body["model"],
      streaming: body["stream"] || false,
      topP: body["top_p"],
      maxTokens: body["max_tokens"],
    };

    const chatHistory: BaseMessageLike[] = [];
    for (const message of body["messages"]) {
      const content = message["content"];
      const role = message["role"];
      if (Array.isArray(content)) {
        for (const contentPiece of content) {
          if (
            contentPiece["type"] === "image_url" &&
            (contentPiece["image_url"] as { url: string })["url"].startsWith(
              "http",
            )
          ) {
            // @ts-ignore
            contentPiece["image_url"] = await urlToDataURL(
              contentPiece["image_url"]["url"],
            );
          }
        }
      }
      switch (role) {
        case "system":
          chatHistory.push(new SystemMessage(content as string));
          break;
        case "user":
          // @ts-ignore
          chatHistory.push(new HumanMessage({ content: content }));
          break;
        case "assistant":
          chatHistory.push(new AIMessage(content as string));
          break;
      }
    }
    if (body.tools && body.tools.length > 0) {
      const functions: BaseFunctionCallOptions = {
        functions: [],
      };
      for (const tool of body.tools) {
        if (tool.type == "function") {
          //@ts-ignore
          functions.functions.push(tool.function);
        }
      }
      if (isChatCompletionNamedToolChoice(body.tool_choice)) {
        //@ts-ignore
        if (body.tool_choice.type == "function") {
          //@ts-ignore
          functions.function_call = body.tool_choice.function;
        }
      }
      mergedParams.options = functions;
    }
    mergedParams.input = chatHistory;
    c.set("params", mergedParams);
    return mergedParams;
  }

  async executeModel(
    c: Context,
    chatModelParams: ChatModelParams,
  ): Promise<string | BaseMessageChunk | IterableReadableStream<any>> {
    const openAIChatModelInput:
      & Partial<OpenAIChatInput>
      & BaseChatModelParams
      & {
        configuration?: ClientOptions;
      } = {
      cache: chatModelParams.cache ?? true,
      openAIApiKey: chatModelParams.apiKey ??
        env<{ OPENAI_BASE_URL: string }>(c)["OPENAI_API_KEY"],
      configuration: {
        baseURL: env<{ OPENAI_BASE_URL: string }>(c)["OPENAI_BASE_URL"] ??
          undefined,
      },
    };
    const openAIChatInput = { ...chatModelParams, ...openAIChatModelInput };
    // @ts-ignore
    const model = new ChatOpenAI(openAIChatInput);
    // @ts-ignore
    return chatModelParams.streaming
      ? await model.stream(chatModelParams.input, chatModelParams.options)
      : await model.invoke(chatModelParams.input, chatModelParams.options);
  }

  async deliverOutput(
    c: Context,
    output: string | IterableReadableStream<any>,
  ): Promise<Response> {
    const params: ChatModelParams = await c.get("params") ?? {};
    if (
      output instanceof IterableReadableStream ||
      isIterableReadableStream(output)
    ) {
      return streamSSE(c, async (stream) => {
        for await (const chunk of output) {
          if (chunk) {
            await stream.writeSSE({
              data: JSON.stringify(
                this.createCompletionChunk(chunk, params),
              ),
            });
          }
        }
        await stream.writeSSE({ data: "[DONE]" });
      });
    } else if (output) {
      // @ts-ignore
      return c.json(
        this.createCompletion(output, params),
      );
    }
  }

  createCompletionChunk(
    message: string | BaseMessage,
    params: ChatModelParams,
  ) {
    if (isBaseMessageChunk(message) || isBaseMessage(message)) {
      return {
        id: `chatcmpl-${Date.now()}`,
        choices: [
          {
            delta: {
              "role": `assistant`,
              "content": message.content.toString(),
              "tool_calls": message.additional_kwargs.tool_calls,
            },
            finish_reason: message.response_metadata.finishReason.toString(),
            index: message.response_metadata.index as number,
            logprobs: message.response_metadata.logprobs,
          },
        ],
        created: Math.floor(Date.now() / 1000),
        model: params.model || "unknown",
        object: "chat.completion.chunk",
        usage: message.response_metadata.estimatedTokenUsage,
      };
    } else {
      return {
        id: `chatcmpl-${Date.now()}`,
        choices: [
          {
            delta: {
              "role": `assistant`,
              "content": message,
            },
            finish_reason: "length",
            index: 0,
            logprobs: null,
          },
        ],
        created: Math.floor(Date.now() / 1000),
        model: params.model || "unknown",
        object: "chat.completion.chunk",
      };
    }
  }

  createCompletion(message: string | BaseMessage, params: ChatModelParams) {
    if (isBaseMessageChunk(message) || isBaseMessage(message)) {
      return {
        id: `chatcmpl-${Date.now()}`,
        choices: [
          {
            message: {
              "role": `assistant`,
              "content": message.content.toString(),
              "tool_calls": message.additional_kwargs.tool_calls,
            },
            finish_reason: message.response_metadata.finishReason.toString(),
            index: message.response_metadata.index as number,
            logprobs: message.response_metadata.logprobs,
          },
        ],
        created: Math.floor(Date.now() / 1000),
        model: params.model || "unknown",
        object: "chat.completion",
        usage: message.response_metadata.estimatedTokenUsage,
      };
    } else {
      return {
        id: `chatcmpl-${Date.now()}`,
        choices: [
          {
            message: {
              "role": `assistant`,
              "content": message,
            },
            finish_reason: "length",
            index: 0,
            logprobs: null,
          },
        ],
        created: Math.floor(Date.now() / 1000),
        model: params.model || "unknown",
        object: "chat.completion",
      };
    }
  }
}

export class OpenAITranscriptionService
  extends AbstractAudioTranscriptionService {
  async prepareModelParams(c: Context): Promise<TranscriptionParams> {
    let params = await c.get("params") as TranscriptionParams;
    const formData = await c.req.parseBody({ all: true });
    params.file =
      (Array.isArray(formData["file"])
        ? formData["file"].pop()
        : formData["file"]) as File;
    params.model = (params.model || formData["model"]) as string;
    return params;
  }

  async executeModel(
    c: Context,
    params: TranscriptionParams,
  ): Promise<Document[]> {
    const clientOptions: ClientOptions = params as ClientOptions;
    const audioLoader = new OpenAIWhisperAudio(params.file, {
      clientOptions: clientOptions,
    });
    return await audioLoader.load();
  }

  async deliverOutput(c: Context, output: Document[]): Promise<Response> {
    let text = "";
    let words = [];
    for (const document of output) {
      text += document.pageContent;
      words.concat(document.metadata["words"] || []);
    }
    const transcriptionResponse = openaiSchemas
      .CreateTranscriptionResponseVerboseJson.parse({
        "text": text,
        "words": words,
      });
    return c.json(transcriptionResponse);
  }
}

export class OpenAIImageEditService extends AbstractImageEditService {
  async prepareModelParams(c: Context): Promise<ImageEditParams> {
    let params: ImageEditParams = await c.get("params") ?? {};
    const formData = await c.req.parseBody();
    const fileFields = ["image", "mask"];
    for (const field of fileFields) {
      params[field] = formData[field];
    }
    const otherFields = [
      "prompt",
      "model",
      "n",
      "size",
      "response_format",
      "user",
    ];
    for (const field of otherFields) {
      if (formData[field]) {
        params[field] = params[field] || formData[field];
      }
    }
    params["model"] = (params["model"] || formData["model"]) as string;
    c.set("params", params);
    return params;
  }
  async deliverOutput(c: Context, output: string | Blob): Promise<Response> {
    const params = await c.get("params") as ImageEditParams;
    const currentTime = Math.floor(Date.now() / 1000);
    if (typeof output === "string") {
      if (params.response_format === "url") {
        return c.json({
          created: currentTime,
          data: [{ url: output }],
        });
      } else if (params.response_format === "b64_json") {
        return c.json({
          created: currentTime,
          data: [{ b64_json: output }],
        });
      }
    } else if (output instanceof Blob) {
      const b64Json = await blobToBase64(output);
      return c.json({
        created: currentTime,
        data: [{ b64_json: b64Json }],
      });
    } else {
      throw new Error(`The output types are incompatible.`);
    }
  }
}

export class OpenAIEmbeddingService extends AbstractEmbeddingService {
  async prepareModelParams(c: Context): Promise<EmbeddingParams> {
    const baseModelParams: EmbeddingParams = await c.get("params");
    // @ts-ignore
    const body: z.infer<typeof openaiSchemas.CreateEmbeddingRequest> = await c
      // @ts-ignore
      .req.valid("json");
    let embeddingParams: EmbeddingParams = {
      ...baseModelParams,
      ...body,
      model: baseModelParams.model || body.model,
      input: body.input as string | string[],
    };
    c.set("params", embeddingParams);
    return embeddingParams;
  }

  async executeModel(
    c: Context,
    params: EmbeddingParams,
  ): Promise<number[] | number[][]> {
    const embeddingsParams: Partial<OpenAIEmbeddingsParams> & {
      verbose?: boolean;
      openAIApiKey?: string;
      configuration?: ClientOptions;
    } = {
      ...params,
      openAIApiKey: params.apiKey ||
        env<{ OPENAI_API_KEY: string }>(c)["OPENAI_API_KEY"],
      configuration: {
        baseURL: params.baseURL ||
          env<{ OPENAI_BASE_URL: string }>(c)["OPENAI_BASE_URL"],
      },
    };
    const embeddings = new OpenAIEmbeddings(embeddingsParams);
    return Array.isArray(params.input)
      ? await embeddings.embedDocuments(params.input)
      : await embeddings.embedQuery(params.input);
  }

  async deliverOutput(
    c: Context,
    output: number[] | number[][],
  ): Promise<Response> {
    const embeddingParams: EmbeddingParams = await c.get("params");
    let embeddingData;
    if (Array.isArray(output) && Array.isArray(output[0])) {
      embeddingData = output.map((embeddingArray, index) => ({
        object: "embedding",
        embedding: embeddingArray,
        index: index,
      }));
    } else if (Array.isArray(output)) {
      embeddingData = [{
        object: "embedding",
        embedding: output,
        index: 0,
      }];
    } else {
      throw new Error("The output types are incompatible.");
    }
    return c.json({
      object: "list",
      data: embeddingData,
      model: embeddingParams.model,
      usage: {
        prompt_tokens: 0,
        total_tokens: 0,
      },
    });
  }
}

export class OpenAIImageGenerationService
  extends AbstractImageGenerationService {
  async executeModel(c: Context, params: ImageGenerationParams) {
    const { apiKey, prompt } = params;
    const apiParams = {
      openAIApiKey: apiKey ||
        env<{ OPENAI_API_KEY: string }>(c)["OPENAI_API_KEY"],
      responseFormat: params.response_format as ("url" | "b64_json"),
    };
    const tool = new DallEAPIWrapper(apiParams);
    return await tool.invoke(prompt);
  }
}

export class OpenAIExceptionHandling implements IExceptionHandling {
  handleException(exception: LangException): Response {
    const error: OpenAIError = {
      code: 500,
      message: exception.message,
      param: null,
      type: "generic",
    };
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
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
