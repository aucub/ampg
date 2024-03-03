import { ChatGoogleGenerativeAI, GoogleGenerativeAIChatInput, GoogleGenerativeAIEmbeddingsParams } from "npm:@langchain/google-genai";
import { BaseLanguageModelInput } from "../deps.ts";
import { ChatModelParams, EmbeddingsParams } from "../types.ts";
import { GoogleGenerativeAIEmbeddings } from "npm:@langchain/google-genai";
import config from "../config.ts";

export async function generateContentGoogleGenerative(params: ChatModelParams, chatHistory: BaseLanguageModelInput) {
    const ggai: GoogleGenerativeAIChatInput = {}
    for (const key in params) {
        const typedKey1 = key as keyof GoogleGenerativeAIChatInput;
        const typedKey2 = key as keyof ChatModelParams;
        if (typedKey1 == typedKey2) {
            // deno-lint-ignore ban-ts-comment
            // @ts-ignore
            ggai[typedKey1] = params[typedKey2];
        }
    }
    ggai['maxOutputTokens'] = params['maxTokens'];
    ggai['stopSequences'] = params['stop'];
    const model = new ChatGoogleGenerativeAI(ggai);
    if (!params['streaming']) {
        return await model.invoke(chatHistory);
    } else {
        return await model.stream(chatHistory);
    }
}


export async function generateEmbeddingsGoogleGenerative(params: EmbeddingsParams, texts: string[] | string) {
    const ggap: Partial<GoogleGenerativeAIEmbeddingsParams> = {}
    for (const key in params) {
        const typedKey1 = key as keyof GoogleGenerativeAIEmbeddingsParams;
        const typedKey2 = key as keyof EmbeddingsParams;
        if (typedKey1 == typedKey2) {
            if (typeof ggap[typedKey1] != typeof params[typedKey2]) {
                continue;
            }
            // deno-lint-ignore ban-ts-comment
            // @ts-ignore
            ggap[typedKey1] = params[typedKey2];
        }
    }
    ggap['apiKey'] = params['apiKey'] || config.googleApiKey;
    const embeddings = new GoogleGenerativeAIEmbeddings(ggap);
    if (Array.isArray(texts)) {
        return await embeddings.embedDocuments(texts);
    } else {
        return await embeddings.embedQuery(texts);
    }
}
