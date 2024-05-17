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
  env,
  HumanMessage,
  isBaseMessage,
  isBaseMessageChunk,
  IterableReadableStream,
  OpenAIChatInput,
  streamSSE,
  SystemMessage,
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
  LangException,
  OpenAIError,
} from "../types.ts";
import {
  AbstractChatService,
  AbstractEmbeddingService,
  IExceptionHandling,
} from "../types/i_service.ts";

export class OpenAIChatService extends AbstractChatService {
  async prepareModelParams(c: Context): Promise<ChatModelParams> {
    const params: Partial<ChatModelParams> = await c.get("params") ?? {};
    // @ts-ignore
    const body = await c.req.json();
    if ("stop" in body && body.stop) {
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
      // @ts-ignore
      ? await model.stream(chatModelParams.input, chatModelParams.options)
      // @ts-ignore
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

export class OpenAIEmbeddingService extends AbstractEmbeddingService {
  async prepareModelParams(c: Context): Promise<EmbeddingParams> {
    const baseModelParams: EmbeddingParams = await c.get("params");
    // @ts-ignore
    const body = await c.req.json();
    let embeddingParams: EmbeddingParams = {
      ...baseModelParams,
      ...body,
      model: baseModelParams.model || body.model,
      input: body.input as string | string[],
    };
    c.set("params", embeddingParams);
    return embeddingParams;
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
