import { cloudflareWorkersModel, googleGenaiModel, openAIModel } from "../config.ts";
import { BaseLanguageModelInput, HonoRequest } from "../deps.ts";
import { ChatModelParams, EmbeddingsParams } from "../types.ts";
import { generateCloudflareWorkers } from "./cloudflare.ts";
import { generateContentGoogleGenerative, generateEmbeddingsGoogleGenerative } from "./google-genai.ts";
import { generateOpenAIChatCompletion, generateOpenAIEmbeddings } from "./openai.ts";


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


const TOKEN_STRINGS = '[A-Za-z0-9._~+/-]+=*'
const PREFIX = 'Bearer'

export async function parseHeaders(req: HonoRequest) {
    const params: ChatModelParams = {};
    let apiKey = await req.header('x-portkey-api-key');
    if (!apiKey) {
        const headerToken = await req.header('Authorization')
        if (headerToken) {
            const regexp = new RegExp('^' + PREFIX + ' +(' + TOKEN_STRINGS + ') *$')
            const match = regexp.exec(headerToken)
            if (match) {
                apiKey = match[1];
            }
        }
    }
    if (!apiKey) {
        apiKey = req.query('key')
    }
    params['apiKey'] = apiKey;
    const provider = await req.header('x-portkey-provider');
    if (provider) {
        params['provider'] = provider;
    }
    return params;
}