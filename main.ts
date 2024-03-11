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
  timing,
  zValidator,
} from "./deps.ts";
import { openaiSchemas } from "./types/openai.ts";
import { generateChat, generateEmbeddings } from "./api/chains.ts";
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
    const params: ChatModelParams = await c.get("params");
    const body = await c.req.valid("json");
    const data = await parseOpenAiChatRequest(body, params);
    const message = await generateChat(data["params"], data["chatHistory"]);
    if (message instanceof IterableReadableStream && message !== undefined) {
      return streamSSE(c, async (stream) => {
        for await (const chunk of message) {
          const messageItem = await adaptOpenAIChatResponse(
            data["params"],
            chunk,
          );
          await stream.writeSSE({ data: JSON.stringify(messageItem) });
        }
        await stream.writeSSE({ data: "[DONE]" });
      });
    } else if (typeof message === "string") {
      return c.json(await adaptOpenAIChatResponse(data["params"], message));
    } else if (message instanceof BaseMessage) {
      return c.json(
        await adaptOpenAIChatResponse(
          data["params"],
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
    const params: ChatModelParams = await c.get("params");
    const body = await c.req.valid("json");
    const data = await parseOpenAiEmbeddingsRequest(body, params);
    const embeddings = await generateEmbeddings(data["params"], data["input"]);
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
    const body = await c.req.valid("json");
    // TODO
  },
);

app.notFound((c) => c.json({ message: "Not Found", ok: false }, 404));

app.onError((err, c) => {
  console.error(`${err}`);
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  if (err instanceof Error) {
    return new HTTPException(err.status, { message: err.message })
      .getResponse();
  }
});

Deno.serve(app.fetch);
