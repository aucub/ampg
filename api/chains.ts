import {cloudflareWorkersModel, googleGenaiModel, openAIModel} from "../config.ts";
import {BaseLanguageModelInput, HonoRequest} from "../deps.ts";
import {ChatModelParams, EmbeddingsParams} from "../types.ts";
import {generateCloudflareWorkers} from "./cloudflare.ts";
import {generateContentGoogleGenerative, generateEmbeddingsGoogleGenerative} from "./google-genai.ts";
import {generateOpenAIChatCompletion, generateOpenAIEmbeddings} from "./openai.ts";


export async function generateChat(params: ChatModelParams, chatHistory: BaseLanguageModelInput) {
    if (params['modelName'] !== undefined) {
        if (params['provider'] == 'openai' || openAIModel.includes(params['modelName'])) {
            return await generateOpenAIChatCompletion(params, chatHistory)
        } else if (params['provider'] == 'google' || googleGenaiModel.includes(params['modelName'])) {
            return await generateContentGoogleGenerative(params, chatHistory)
        } else if (params['provider'] == 'cloudflareworkersai' || cloudflareWorkersModel.includes(params['modelName'])) {
            return await generateCloudflareWorkers(params, chatHistory)
        }
    }
}

export async function generateEmbeddings(params: EmbeddingsParams, input: string | string[]) {
    if (params['modelName'] !== undefined) {
        if (params['provider'] == 'openai' || openAIModel.includes(params['modelName'])) {
            return await generateOpenAIEmbeddings(params, input);
        } else if (params['provider'] == 'google' || googleGenaiModel.includes(params['modelName'])) {
            return await generateEmbeddingsGoogleGenerative(params, input)
        }
    }
}


export async function parseHeaders(req: HonoRequest) {
    const params: ChatModelParams = {};
    const auth = req.header('Authorization');
    const apiKey = req.header('x-portkey-api-key');
    const provider = req.header('x-portkey-provider');
    if (auth && auth.startsWith('Bearer ')) {
        params['apiKey'] = auth.split(' ')[1];
    } else if (apiKey) {
        params['apiKey'] = apiKey;
    }
    if (provider) {
        params['provider'] = provider;
    }
    return params;
}