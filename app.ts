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
  z
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
  adaptChatCompletionRequestOpenAI,
  adaptChatCompletionResponseOpenAI,
  adaptEmbeddingsRequestOpenAI,
  adaptEmbeddingsResponseOpenAI,
  adaptErrorResponseOpenAI,
  adaptImagesEditsRequestOpenAI,
  adaptImagesEditsResponseOpenAI,
  adaptTranscriptionRequestOpenAI,
} from "./api/openai.ts";
import {
  ChatModelParams,
  ImagesEditsParams,
  TranscriptionParams,
  LangException
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
    let params: ChatModelParams | undefined;
    try {
      params = await c.get<ChatModelParams>("params");
    } catch (error) {
      console.error("Error retrieving params:", error);
    }
    const body = c.req.valid<z.infer<typeof openaiSchemas.CreateChatCompletionRequest>>("json");
    const data = await adaptChatCompletionRequestOpenAI(body, params || {});
    params = parseParams(data["params"]);
    const message = await generateChat(params, data["chatHistory"]);
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
    let params: ChatModelParams = await c.get<ChatModelParams>("params") as ChatModelParams;
    const body = c.req.valid<any>("json") as any;
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
      return c.json(adaptEmbeddingsResponseOpenAI(params, embeddings as number[] | number[][]));
    }
  },
);

app.post(
  "/v1/images/edits",
  zValidator("form", openaiSchemas.CreateImageEditRequest),
  async (c) => {
    let params = c.get<ImagesEditsParams>("params") as ImagesEditsParams;
    const formData = c.req.valid<any>("form") as any;
    params = adaptImagesEditsRequestOpenAI(formData, params);
    params = parseParams(params);
    const image = await generateEditImage(params);
    if (image) {
      return c.json(await adaptImagesEditsResponseOpenAI(image));
    }
  },
);

app.post(
  "/v1/audio/transcriptions",
  zValidator("form", openaiSchemas.CreateTranscriptionRequest),
  async (c) => {
    let params = c.get<TranscriptionParams>("params") as TranscriptionParams;
    const formData = c.req.valid<any>("form");
    params = adaptTranscriptionRequestOpenAI(formData, params);
    params = parseParams(params);
    return c.json(await generateTranscription(params));
  },
);

app.onError(async (err, c): Promise<Response> => {
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
  console.error(`${err}`);
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
