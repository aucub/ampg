import { ChatCloudflareWorkersAI, BaseLanguageModelInput } from "../deps.ts";
import config from '../config.ts';
import { ChatModelParams } from "../types.ts";

export async function generateCloudflareWorkers(params: ChatModelParams, chatHistory: BaseLanguageModelInput) {
    const model = await new ChatCloudflareWorkersAI({
        model: params['modelName'],
        cloudflareAccountId: params['user'] || config.cloudflareAccountId,
        cloudflareApiToken: params['apiKey'] || config.cloudflareApiToken,
        baseUrl: params['baseURL'] || null,
        streaming: params['streaming'] || false
    });
    if (!params['streaming']) {
        return await model.invoke(chatHistory);
    } else {
        return await model.stream(chatHistory);
    }
}