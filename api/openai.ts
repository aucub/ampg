import { ChatOpenAI, ClientOptions, OpenAIChatInput } from "npm:@langchain/openai";
import { BaseLanguageModelInput } from '../deps.ts';
import { HumanMessage, AIMessage, BaseMessageLike } from "npm:@langchain/core/messages";
import { AIInput } from "../types.ts";
import config from "../config.ts";

export async function interpretRequestData(text: string, params: AIInput) {
    const data = await JSON.parse(text);
    for (const key in data) {
        const typedKey = key as keyof AIInput;
        params[typedKey] = data[key] || params[typedKey];
    }
    params['streaming'] = data['stream'];
    const chatHistory: BaseMessageLike[] = []
    for (let i = 0; i < data['messages'].length; i++) {
        const message = data['messages'][i];
        if (message['role'] === "user") {
            chatHistory.push(new HumanMessage(message['content']));
        } else if (message['role'] === "assistant") {
            chatHistory.push(new AIMessage(message['content']));
        }
    }
    return { params, chatHistory }
}

export async function invokeOpenAI(params: AIInput, chatHistory: BaseLanguageModelInput) {
    const oaci: Partial<OpenAIChatInput> & { configuration: Partial<ClientOptions> } = {
        configuration: {}
    }
    for (const key in params) {
        const typedKey1 = key as keyof OpenAIChatInput;
        const typedKey2 = key as keyof AIInput;
        if (typedKey1 === typedKey2) {
            if (typeof oaci[typedKey1] != typeof params[typedKey2]) {
                continue;
            }
            // deno-lint-ignore ban-ts-comment
            // @ts-ignore
            oaci[typedKey1] = params[typedKey2];
        }
    }
    oaci['modelName'] = params['model'];
    oaci['openAIApiKey'] = params['apiKey'] || config.openaiApiKey;
    oaci['configuration']['baseURL'] = params['baseUrl'] || config.openaiBaseUrl;
    const model = new ChatOpenAI(oaci);
    if (!params['streaming']) {
        return await model.invoke(chatHistory);
    } else {
        return await model.stream(chatHistory);
    }
}

export function interpretCompletionData(params: AIInput, data: string) {
    return {
        id: `chatcmpl-${Date.now()}`,
        choices: [
            {
                finish_reason: "length",
                index: 0,
                logprobs: null,
                text: data
            }
        ],
        created: Math.floor(Date.now() / 1000),
        model: params['model'] || 'unkown',
        object: "text_completion"
    };

}
