import {
  BaseMessage,
  compress,
  cors,
  Hono,
  HTTPException,
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
  generateChat,
  generateEditImage,
  generateEmbeddings,
  generateTranscription,
  parseParams,
} from "./api/chains.ts";
import { headersMiddleware } from "./api/middleware.ts";
import {
  adaptChatCompletionResponseOpenAI,
  adaptImagesEditsResponseOpenAI,
  adaptEmbeddingsResponseOpenAI,
  adaptErrorResponseOpenAI,
  adaptChatCompletionRequestOpenAI,
  adaptImagesEditsRequestOpenAI,
  adaptEmbeddingsRequestOpenAI,
  adaptTranscriptionRequestOpenAI,
} from "./api/openai.ts";
import {
  ChatModelParams,
  ImagesEditsParams,
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
  zValidator("json", openaiSchemas.CreateChatCompletionRequest),
  async (c) => {
    let params: ChatModelParams = await c.get("params");
    const body = c.req.valid("json");
    const data = await adaptChatCompletionRequestOpenAI(body, params);
    params = parseParams(data["params"]);
    const message = await generateChat(params, data["chatHistory"]);
    if (message instanceof IterableReadableStream) {
      return streamSSE(c, async (stream) => {
        for await (const chunk of message) {
          const messageItem = await adaptChatCompletionResponseOpenAI(
            params,
            chunk,
          );
          await stream.writeSSE({ data: JSON.stringify(messageItem) });
        }
        await stream.writeSSE({ data: "[DONE]" });
      });
    } else if (typeof message === "string") {
      return c.json(await adaptChatCompletionResponseOpenAI(params, message));
    } else if (message instanceof BaseMessage) {
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
    let params: ChatModelParams = await c.get("params");
    const body = c.req.valid("json");
    const data = adaptEmbeddingsRequestOpenAI(body, params);
    params = parseParams(data["params"]);
    let input;
    if (Array.isArray(data["input"])) {
      input = data["input"] as string[];
    } else {
      input = data["input"] as string;
    }
    const embeddings = await generateEmbeddings(params, input);
    if (embeddings !== undefined) {
      return c.json(adaptEmbeddingsResponseOpenAI(params, embeddings));
    }
  },
);

app.post(
  "/v1/images/edits",
  zValidator("form", openaiSchemas.CreateImageEditRequest),
  async (c) => {
    let params: ImagesEditsParams = await c.get("params");
    const formData = await c.req.valid("form");
    params = adaptImagesEditsRequestOpenAI(formData, params);
    params = await parseParams(params);
    const image = await generateEditImage(params);
    return await c.json(await adaptImagesEditsResponseOpenAI(image));
  },
);

app.post(
  "/v1/audio/transcriptions",
  zValidator("form", openaiSchemas.CreateTranscriptionRequest),
  async (c) => {
    let params: TranscriptionParams = await c.get("params");
    const formData = await c.req.valid("form");
    params = await adaptTranscriptionRequestOpenAI(formData, params);
    params = await parseParams(params);
    return await c.json(await generateTranscription(params));
  },
);

app.notFound((c) => c.json({ message: "Not Found", ok: false }, 404));

app.onError(async (err, c) => {
  const exception: LangException = LangException();
  if (err instanceof ToolInputParsingException) {
    exception.message = err.message;
    exception.output = err.output;
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
    if (openAIPaths.includes(await c.req.path)) {
      return adaptErrorResponseOpenAI(exception);
    }
  }
  console.error(`${err}`);
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  const options = { message: err.message };
  if (err instanceof Error) {
    return new HTTPException(options).getResponse();
  }
});

export { app };
