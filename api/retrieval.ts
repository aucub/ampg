import { cloudflareWorkersModel, googleGenaiModel, openAIModel } from "../config.ts";
import { BaseLanguageModelInput } from "../deps.ts";
import { AIInput } from "../types.ts";
import { invokeCloudflareWorkers } from "./cloudflare.ts";
import { invokeGoogleGenerative } from "./google-genai.ts";
import { invokeOpenAI } from "./openai.ts";


export async function invoke(params: AIInput, chatHistory: BaseLanguageModelInput) {
    if (params['model'] !== undefined) {
        if (params['provider'] == 'openai' || openAIModel.includes(params['model'])) {
            return await invokeOpenAI(params, chatHistory)
        } else if (params['provider'] == 'google' || googleGenaiModel.includes(params['model'])) {
            return await invokeGoogleGenerative(params, chatHistory)
        } else if (params['provider'] == 'cloudflareworkersai' || cloudflareWorkersModel.includes(params['model'])) {
            return await invokeCloudflareWorkers(params, chatHistory)
        }
    }
}



export function interpretHeaders(headers: Headers) {
    const params: AIInput = {};
    const auth = headers.get('Authorization');
    const apiKey = headers.get('x-portkey-api-key');
    const provider = headers.get('x-portkey-provider');
    if (auth && auth.startsWith('Bearer ')) {
        const token = auth.split(' ')[1];
        params['apiKey'] = token;
    } else if (apiKey) {
        params['apiKey'] = apiKey;
    }
    if (provider) {
        params['provider'] = provider;
    }
    return params;
}