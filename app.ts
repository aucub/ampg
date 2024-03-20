import {
  compress,
  cors,
  Hono,
  HTTPException,
  isBaseMessage,
  isBaseMessageChunk,
  IterableReadableStream,
  logger,
  OutputParserException,
  prettyJSON,
  secureHeaders,
  streamSSE,
  timing,
  ToolInputParsingException,
  zValidator,
} from "./deps.ts";
import { schemas as openaiSchemas } from "./types/openai.ts";
import {
  chatCompletion,
  embedding,
  imageEdit,
  parseError,
  parseParams,
  transcription,
} from "./api/chains.ts";
import { headersMiddleware } from "./api/middleware.ts";
import {
  adaptChatCompletionRequestOpenAI,
  adaptChatCompletionResponseOpenAI,
  adaptEmbeddingRequestOpenAI,
  adaptEmbeddingResponseOpenAI,
  adaptImageEditRequestOpenAI,
  adaptImageResponseOpenAI,
  adaptTranscriptionRequestOpenAI,
} from "./api/openai.ts";
import {
  BaseModelParams,
  ChatModelParams,
  ImageEditParams,
  LangException,
  TranscriptionParams,
} from "./types.ts";

const app = new Hono();

app.use(
  logger(),
  cors(),
  secureHeaders(),
  timing(),
  headersMiddleware(),
  compress(),
  prettyJSON(),
);

app.post(
  "/v1/chat/completions",
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  zValidator("json", openaiSchemas.CreateChatCompletionRequest),
  async (c) => {
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    let params: ChatModelParams = await c.get("params");
    // @ts-ignore
    const body = c.req.valid("json");
    const data = await adaptChatCompletionRequestOpenAI(body, params || {});
    params = parseParams(data["params"]);
    const message = await chatCompletion(params, data["chatHistory"]);
    if (
      message != undefined &&
      (message instanceof IterableReadableStream ||
        ("locked" in message && "cancel" in message && "getReader" in message))
    ) {
      return streamSSE(c, async (stream) => {
        for await (let chunk of message) {
          chunk = chunk as string;
          if (chunk) {
            const messageItem = await adaptChatCompletionResponseOpenAI(
              params!,
              chunk as string,
            );
            await stream.writeSSE({ data: JSON.stringify(messageItem) });
          }
        }
        await stream.writeSSE({ data: "[DONE]" });
      });
    } else if (typeof message === "string") {
      return c.json(await adaptChatCompletionResponseOpenAI(params, message));
    } else if (isBaseMessageChunk(message) || isBaseMessage(message)) {
      return c.json(
        await adaptChatCompletionResponseOpenAI(
          params,
          message.content.toString(),
        ),
      );
    }
  },
);

app.post(
  "/v1/embeddings",
  zValidator("json", openaiSchemas.CreateEmbeddingRequest),
  async (c) => {
    let params: ChatModelParams = await c.get(
      "params",
    ) as ChatModelParams;
    const body = c.req.valid("json");
    const data = adaptEmbeddingRequestOpenAI(body, params);
    params = parseParams(data["params"]);
    let input;
    if (Array.isArray(data["input"])) {
      input = data["input"] as string[];
    } else {
      input = data["input"] as string;
    }
    const embeddings = await embedding(params, input);
    if (embeddings !== undefined) {
      return c.json(
        adaptEmbeddingResponseOpenAI(
          params,
          embeddings as number[] | number[][],
        ),
      );
    }
  },
);

app.post(
  "/v1/images/edits",
  async (c) => {
    let params = c.get("params") as ImageEditParams;
    const formData = await c.req.parseBody();
    params = adaptImageEditRequestOpenAI(formData, params);
    params = parseParams(params);
    const image = await imageEdit(params);
    if (image) {
      return c.json(await adaptImageResponseOpenAI(image, params));
    }
  },
);

app.post(
  "/v1/audio/transcriptions",
  async (c) => {
    let params = await c.get("params") as TranscriptionParams;
    const formData = await c.req.parseBody();
    params = adaptTranscriptionRequestOpenAI(formData, params);
    params = parseParams(params);
    return c.json(await transcription(params));
  },
);

app.onError((err, c) => {
  console.error(`${err}`);
  let exception: LangException = new LangException();
  if (err instanceof ToolInputParsingException) {
    exception.message = err.message;
    exception.toolOutput = err.output;
  }
  if (err instanceof OutputParserException) {
    exception.message = err.message;
    exception.llmOutput = err.llmOutput;
    exception.observation = err.observation;
  }
  if (err instanceof LangException) {
    exception = err;
  }
  if (exception.message) {
    let params: BaseModelParams = c.get("params");
    return parseError(params, exception);
  }
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  if (err instanceof Error) {
    const options = { message: err.message };
    return new HTTPException(500, options).getResponse();
  }
  return new HTTPException(500, { message: "unknown Error" }).getResponse();
});

export { app };
