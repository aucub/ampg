import { ChatCloudflareWorkersAI } from "npm:@langchain/cloudflare";
import config from '../config.ts';
import { ChatModelParams } from "../types.ts";
import { BaseLanguageModelInput } from "../deps.ts";

export async function generateCloudflareWorkers(params: ChatModelParams, chatHistory: BaseLanguageModelInput) {
    const model = new ChatCloudflareWorkersAI({
        model: params['modelName'],
        cloudflareAccountId: params['user'] || config.cloudflareAccountId,
        cloudflareApiToken: params['apiKey'] || config.cloudflareApiToken,
        baseUrl: params['baseURL'],
        streaming: params['streaming'] || false
    });
    if (!params['streaming']) {
        return await model.invoke(chatHistory);
    } else {
        return await model.stream(chatHistory);
    }
}
