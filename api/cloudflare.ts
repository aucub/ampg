import { CloudflareWorkersAI } from "npm:@langchain/cloudflare";
import config from '../config.ts';
import { AIInput } from "../types.ts";
import { BaseLanguageModelInput } from "../deps.ts";

export async function invokeCloudflareWorkers(params: AIInput, chatHistory: BaseLanguageModelInput) {
    const model = new CloudflareWorkersAI({
        model: params['model'],
        cloudflareAccountId: params['user'] || config.cloudflareAccountId,
        cloudflareApiToken: params['apiKey'] || config.cloudflareApiToken,
        baseUrl: params['baseUrl'],
        streaming: params['streaming'] || false
    });
    if (!params['streaming']) {
        return await model.invoke(chatHistory);
    } else {
        return await model.stream(chatHistory);
    }
}
