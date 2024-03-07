import {
  BaseMessage,
  compress,
  cors,
  Hono,
  IterableReadableStream,
  logger,
  prettyJSON,
  secureHeaders,
  streamSSE,
  timing,
  zValidator,
  HTTPException,
} from "./deps.ts";
import { schemas } from "./types/openai.ts";
import {
  generateChat,
  generateEmbeddings,
  parseHeaders,
} from "./api/chains.ts";
import {
  adaptOpenAIChatResponse,
  adaptOpenAIEmbeddingsResponse,
  parseOpenAiChatRequest,
  parseOpenAiEmbeddingsRequest,
} from "./api/openai.ts";

const app = new Hono();
app.use(timing(), compress(), logger(), secureHeaders(), cors(), prettyJSON());


app.post(
  "/v1/chat/completions",
  zValidator("json", schemas.CreateChatCompletionRequest, (result, c) => {
    if (!result.success) {
      console.error(result);
      return c.text(result.error, 400);
    }
  }),
  async (c) => {
    const params = await parseHeaders(c.req);
    const body = await c.req.json();
    const data = await parseOpenAiChatRequest(body, params);
    const message = await generateChat(data["params"], data["chatHistory"]);
    if (data["params"]["streaming"]) {
      c.res.headers.set("Content-Type", "text/event-stream");
      c.res.headers.set("Connection", "keep-alive");
      c.res.headers.set("Cache-Control", "no-cache");
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
      }
    } else {
      if (typeof message === "string") {
        const post = await adaptOpenAIChatResponse(data["params"], message);
        return c.json(post);
      } else if (message instanceof BaseMessage) {
        const post = await adaptOpenAIChatResponse(
          data["params"],
          message.content.toString(),
        );
        return c.json(post);
      }
    }
  },
);

app.post(
  "/v1/embeddings",
  zValidator("json", schemas.CreateEmbeddingRequest, (result, c) => {
    if (!result.success) {
      console.error(result);
      return c.text(result.error, 400);
    }
  }),
  async (c) => {
    const params = await parseHeaders(await c.req);
    const body = await c.req.json();
    const data = await parseOpenAiEmbeddingsRequest(body, params);
    const embeddings = await generateEmbeddings(data["params"], data["input"]);
    if (embeddings !== undefined) {
      c.res.body = adaptOpenAIEmbeddingsResponse(params, embeddings);
    }
  },
);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  if (err instanceof Error) {
    return new HTTPException(err.status, { message: err.message }).getResponse()
  }
})

Deno.serve(app.fetch);