import {
  BaseMessage,
  compress,
  cors,
  Hono,
  HTTPException,
  IterableReadableStream,
  logger,
  prettyJSON,
  secureHeaders,
  streamSSE,
  timing,
  zValidator,
} from "./deps.ts";
import { schemas as openaiSchemas } from "./types/openai.ts";
import { generateChat, generateEmbeddings, parseParams } from "./api/chains.ts";
import { headersMiddleware } from "./api/middleware.ts";
import {
  adaptOpenAIChatResponse,
  adaptOpenAIEmbeddingsResponse,
  parseOpenAiChatRequest,
  parseOpenAiEmbeddingsRequest,
} from "./api/openai.ts";
import { ChatModelParams } from "./types.ts";

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
    const data = await parseOpenAiChatRequest(body, params);
    params = parseParams(data["params"]);
    const message = await generateChat(params, data["chatHistory"]);
    if (message instanceof IterableReadableStream && message !== undefined) {
      return streamSSE(c, async (stream) => {
        for await (const chunk of message) {
          const messageItem = await adaptOpenAIChatResponse(
            params,
            chunk,
          );
          await stream.writeSSE({ data: JSON.stringify(messageItem) });
        }
        await stream.writeSSE({ data: "[DONE]" });
      });
    } else if (typeof message === "string") {
      return c.json(await adaptOpenAIChatResponse(params, message));
    } else if (message instanceof BaseMessage) {
      return c.json(
        await adaptOpenAIChatResponse(
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
    const data = parseOpenAiEmbeddingsRequest(body, params);
    params = parseParams(data["params"]);
    let input;
    if (Array.isArray(data["input"])) {
      input = data["input"] as string[]
    } else {
      input = data["input"] as string
    }
    const embeddings = await generateEmbeddings(params, input);
    if (embeddings !== undefined) {
      return c.json(adaptOpenAIEmbeddingsResponse(params, embeddings));
    }
  },
);

app.post(
  "/images/generations",
  zValidator("json", openaiSchemas.CreateImageRequest),
  async (c) => {
    const params: ChatModelParams = await c.get("params");
    const body = c.req.valid("json");
    // TODO
  },
);

app.notFound(async (c) => c.json({ message: "Not Found", ok: false }, 404));

app.onError((err) => {
  console.error(`${err}`);
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  if (err instanceof Error) {
    return new HTTPException({ message: err.message }).getResponse();
  }
});

export { app };
