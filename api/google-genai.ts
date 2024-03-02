import { ChatGoogleGenerativeAI, GoogleGenerativeAIChatInput } from "npm:@langchain/google-genai";
import { BaseLanguageModelInput } from "../deps.ts";
import { AIInput } from "../types.ts";


export async function invokeGoogleGenerative(params: AIInput, chatHistory: BaseLanguageModelInput) {
    const ggai: GoogleGenerativeAIChatInput = {}
    for (const key in params) {
        const typedKey1 = key as keyof GoogleGenerativeAIChatInput;
        const typedKey2 = key as keyof AIInput;
        if (typedKey1 === typedKey2) {
            // deno-lint-ignore ban-ts-comment
            // @ts-ignore
            ggai[typedKey1] = params[typedKey2];
        }
    }
    ggai['modelName'] = params['model'];
    ggai['maxOutputTokens'] = params['maxTokens'];
    ggai['stopSequences'] = params['stop'];
    const model = new ChatGoogleGenerativeAI(ggai);
    if (!params['streaming']) {
        return await model.invoke(chatHistory);
    } else {
        return await model.stream(chatHistory);
    }
}
