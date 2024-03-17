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
  z,
  zValidator,
} from "./deps.ts";
import { schemas as openaiSchemas } from "./types/openai.ts";
import {
  chatCompletion,
  embedding,
  imageEdit,
  parseParams,
  transcription,
} from "./api/chains.ts";
import { headersMiddleware } from "./api/middleware.ts";
import {
  adaptChatCompletionRequestOpenAI,
  adaptChatCompletionResponseOpenAI,
  adaptEmbeddingRequestOpenAI,
  adaptEmbeddingResponseOpenAI,
  adaptErrorResponseOpenAI,
  adaptImageEditRequestOpenAI,
  adaptImageEditResponseOpenAI,
  adaptTranscriptionRequestOpenAI,
} from "./api/openai.ts";
import {
  ChatModelParams,
  ImageEditParams,
  LangException,
  TranscriptionParams,
} from "./types.ts";
import { openAIPaths } from "./config.ts";

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
  zValidator("json", openaiSchemas.CreateChatCompletionRequest),
  async (c) => {
    let params: ChatModelParams = await c.get(
      "params",
    ) as ChatModelParams;
    const body = c.req.valid("json");
    const data = await adaptChatCompletionRequestOpenAI(body, params || {});
    params = parseParams(data["params"]);
    const message = await chatCompletion(params, data["chatHistory"]);
    if (message instanceof IterableReadableStream) {
      return streamSSE(c, async (stream) => {
        for await (const chunk of message) {
          const messageItem = await adaptChatCompletionResponseOpenAI(
            params!,
            chunk,
          );
          await stream.writeSSE({ data: JSON.stringify(messageItem) });
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
  zValidator("form", openaiSchemas.CreateImageEditRequest),
  async (c) => {
    let params = c.get("params") as ImageEditParams;
    const formData = c.req.valid("form");
    params = adaptImageEditRequestOpenAI(formData, params);
    params = parseParams(params);
    const image = await imageEdit(params);
    if (image) {
      return c.json(await adaptImageEditResponseOpenAI(image));
    }
  },
);

app.post(
  "/v1/audio/transcriptions",
  zValidator("form", openaiSchemas.CreateTranscriptionRequest),
  async (c) => {
    let params = c.get("params") as TranscriptionParams;
    const formData = c.req.valid("form");
    params = adaptTranscriptionRequestOpenAI(formData, params);
    params = parseParams(params);
    return c.json(await transcription(params));
  },
);

app.onError((err, c): Promise<Response> => {
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
    if (openAIPaths.includes(c.req.path)) {
      return adaptErrorResponseOpenAI(exception);
    }
  }
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  if (err instanceof Error) {
    const options = { message: err.message };
    return new HTTPException(500, options).getResponse();
  }
  return new HTTPException(500, {}).getResponse();
});

export { app };
