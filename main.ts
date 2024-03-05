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

app.use("*", timing());

app.use("*", compress());

app.use("*", logger());

app.use("*", secureHeaders());

app.use("*", cors());

app.use("*", prettyJSON());

app.post(
  "/v1/chat/completions",
  zValidator("json", schemas.CreateChatCompletionRequest), async (result, c) => {
    if (!result.success) {
      return c.text("Invalid!", 400);
    }
    const params = await parseHeaders(c.req);
    const body = await c.req.json();
    const data = await parseOpenAiChatRequest(body, params);
    const message = generateChat(data["params"], data["chatHistory"]);
    if (data["params"]["streaming"]) {
      c.res.headers.set("Content-Type", "text/event-stream");
      c.res.headers.set("Connection", "keep-alive");
      c.res.headers.set("Cache-Control", "no-cache");
      if (message instanceof IterableReadableStream && message !== undefined) {
        return streamSSE(c, async (stream) => {
          for await (const chunk of message) {
            const messageItem = await adaptpenAIChatResponse(
              data["params"],
              chunk,
            );
            await stream.writeSSE(messageItem);
          }
          await stream.writeSSE("[DONE]");
        });
      }
    } else {
      if (typeof message === "string") {
        c.res.body = adaptOpenAIChatResponse(data["params"], message);
      } else if (message instanceof BaseMessage) {
        c.res.body = adaptOpenAIChatResponse(
          data["params"],
          message.content.toString(),
        );
      }
    }
  },
);

app.post(
  "/v1/embeddings",
  zValidator("json", schemas.CreateEmbeddingRequest),
  (result, c) => {
    if (!result.success) {
      return c.text("Invalid!", 400);
    }
    const params = parseHeaders(c.req);
    const body = c.req.json();
    const data = parseOpenAiEmbeddingsRequest(body, params);
    const embeddings = generateEmbeddings(data["params"], data["input"]);
    if (embeddings !== undefined) {
      c.res.body = adaptOpenAIEmbeddingsResponse(params, embeddings);
    }
  },
);

Deno.serve(app.fetch);
