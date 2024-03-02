import { BaseMessage } from "npm:@langchain/core/messages";
import { interpretCompletionData, interpretRequestData } from "./api/openai.ts";
import { interpretHeaders, invoke } from './api/retrieval.ts';
import { Application } from "https://deno.land/x/oak@v14.1.0/mod.ts";
import { IterableReadableStream } from "npm:@langchain/core/utils/stream";

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
    const path = ctx.request.url.toString();
    if (path.includes("chat/completions")) {
        const body = await ctx.request.body;
        const headers = await ctx.request.headers;
        const text = await body.text();
        const params = await interpretHeaders(headers);
        const data = await interpretRequestData(text, params);
        const message = await invoke(data['params'], data['chatHistory'])
        if (data['params']['streaming']) {
            if (message instanceof IterableReadableStream && message !== undefined) {
                ctx.request.accepts("text/event-stream");
                const targetPromise = ctx.sendEvents();
                const target = await targetPromise;
                for await (const chunk of message) {
                    let dataResult: string | object = '';
                    if (typeof chunk === 'string') {
                        dataResult = await interpretCompletionData(data['params'], chunk);
                    } else if (chunk instanceof BaseMessage) {
                        dataResult = await interpretCompletionData(data['params'], chunk.content.toString());
                    }
                    target.dispatchMessage(dataResult);
                }
                target.dispatchMessage('[DONE]');
                target.close();
            }
        } else {
            if (typeof message === 'string') {
                ctx.response.body = interpretCompletionData(data['params'], message);
            } else if (message instanceof BaseMessage) {
                ctx.response.body = interpretCompletionData(data['params'], message.content.toString());
            }
        }
    }
});

await app.listen({ port: 8000 });
