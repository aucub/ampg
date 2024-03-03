import { BaseMessage } from "npm:@langchain/core/messages";
import { adaptOpenAIChatResponse, adaptOpenAIEmbeddingsResponse, parseOpenAiChatRequest, parseOpenAiEmbeddingsRequest } from "./api/openai.ts";
import { parseHeaders, generateChat } from './api/chains.ts';
import { Application } from "https://deno.land/x/oak@v14.1.0/mod.ts";
import { IterableReadableStream } from "npm:@langchain/core/utils/stream";
import { generateEmbeddings } from "./api/chains.ts";

const app = new Application();

// Logger
app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.headers.get("X-Response-Time");
    console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});

// Timing
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

app.use(async (ctx) => {
    const headers = ctx.request.headers;
    const params = await parseHeaders(headers);
    const requestData = await ctx.request.body.text();
    const url = ctx.request.url.toString();
    if (url.includes("embeddings")) {
        const data = await parseOpenAiEmbeddingsRequest(requestData, params);
        const embeddings = await generateEmbeddings(data['params'], data['input'])
        if (embeddings !== undefined) {
            ctx.response.body = adaptOpenAIEmbeddingsResponse(params, embeddings);
        }
    }
    if (url.includes("chat/completions")) {
        const data = await parseOpenAiChatRequest(requestData, params);
        const message = await generateChat(data['params'], data['chatHistory'])
        if (data['params']['streaming']) {
            ctx.response.headers.set("Content-Type", "text/event-stream");
            ctx.response.headers.set("Connection", "keep-alive");
            ctx.response.headers.set("Cache-Control", "no-cache");
            if (message instanceof IterableReadableStream && message !== undefined) {
                const target = await ctx.sendEvents();
                for await (const chunk of message) {
                    const messageItem = await adaptOpenAIChatResponse(data['params'], chunk);
                    target.dispatchMessage(messageItem);
                }
                target.dispatchMessage('[DONE]');
                await target.close();
            }
        } else {
            if (typeof message === 'string') {
                ctx.response.body = await adaptOpenAIChatResponse(data['params'], message);
            } else if (message instanceof BaseMessage) {
                ctx.response.body = await adaptOpenAIChatResponse(data['params'], message.content.toString());
            }
        }
    }
});

await app.listen({ port: 8000 });
