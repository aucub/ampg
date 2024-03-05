import {
    ChatOpenAI,
    ClientOptions,
    OpenAIChatInput,
    OpenAIEmbeddings,
    OpenAIEmbeddingsParams,
} from "../deps.ts";
import { BaseLanguageModelInput } from "../deps.ts";
import {
    AIMessage,
    BaseMessage,
    BaseMessageLike,
    HumanMessage,
    MessageContentComplex,
    SystemMessage,
} from "../deps.ts";
import { ChatModelParams, EmbeddingsParams } from "../types.ts";
import {
    schemas
} from "../types/openai.ts";
import config from "../config.ts";
import { BaseChatModelParams } from "npm:@langchain/core/language_models/chat_models";


export async function parseOpenAiChatRequest(
    data: any,
    params: ChatModelParams,
) {
    for (const key in data) {
        const typedKey = key as keyof ChatModelParams;
        params[typedKey] = data[key] || params[typedKey];
    }
    params["modelName"] = data["model"];
    params["streaming"] = data["stream"];
    const chatHistory: BaseMessageLike[] = [];
    for (let i = 0; i < data["messages"].length; i++) {
        const message = data["messages"][i];
        let messageContent;
        if (typeof message["content"] != "string") {
            messageContent = message["content"] as MessageContentComplex[];
            for await (const content of messageContent) {
                if (
                    content["type"] == "image_url" &&
                    typeof content["image_url"] === "object" &&
                    content["image_url"] !== null && "url" in content["image_url"] &&
                    content["image_url"]["url"].startsWith("http")
                ) {
                    content["image_url"] = await urlToBase64(content["image_url"]["url"]);
                }
            }
        } else {
            messageContent = message["content"];
        }
        if (message["role"] == "system") {
            chatHistory.push(new SystemMessage(message["content"]));
        } else if (message["role"] == "user") {
            // deno-lint-ignore ban-ts-comment
            // @ts-ignore
            chatHistory.push(
                new HumanMessage({
                    content: messageContent,
                }),
            );
        } else if (message["role"] == "assistant") {
            chatHistory.push(new AIMessage(message["content"]));
        }
    }
    return { params, chatHistory };
}

export async function parseOpenAiEmbeddingsRequest(
    data: any,
    params: EmbeddingsParams,
) {
    for await (const key of data) {
        const typedKey = key as keyof EmbeddingsParams;
        params[typedKey] = data[key] || params[typedKey];
    }
    params["modelName"] = data["model"];
    const input = data["input"];
    return { params, input };
}

export async function generateOpenAIEmbeddings(
    params: ChatModelParams,
    texts: string[] | string,
) {
    const oaep: Partial<OpenAIEmbeddingsParams> & {
        verbose?: boolean;
        openAIApiKey?: string;
        configuration: ClientOptions;
    } = { configuration: {} };
    for (const key in params) {
        const typedKey1 = key as keyof OpenAIEmbeddingsParams;
        const typedKey2 = key as keyof ChatModelParams;
        if (typedKey1 == typedKey2) {
            if (typeof oaep[typedKey1] != typeof params[typedKey2]) {
                continue;
            }
            // deno-lint-ignore ban-ts-comment
            // @ts-ignore
            oaep[typedKey1] = params[typedKey2];
        }
    }
    oaep["openAIApiKey"] = params["apiKey"] || config.openaiApiKey;
    oaep["configuration"]["baseURL"] = params["baseURL"] || config.openaiBaseUrl;
    const embeddings = new OpenAIEmbeddings(oaep);
    if (Array.isArray(texts)) {
        return await embeddings.embedDocuments(texts);
    } else {
        return await embeddings.embedQuery(texts);
    }
}

export async function generateOpenAIChatCompletion(
    params: ChatModelParams,
    chatHistory: BaseLanguageModelInput,
) {
    const oaci: Partial<OpenAIChatInput> & BaseChatModelParams & {
        configuration: Partial<ClientOptions>;
    } = {
        configuration: {},
        cache: params["cache"],
    };
    for (const key in params) {
        const typedKey1 = key as keyof OpenAIChatInput;
        const typedKey2 = key as keyof ChatModelParams;
        if (typedKey1 == typedKey2) {
            if (typeof oaci[typedKey1] != typeof params[typedKey2]) {
                continue;
            }
            // deno-lint-ignore ban-ts-comment
            // @ts-ignore
            oaci[typedKey1] = params[typedKey2];
        }
    }
    oaci["modelName"] = params["modelName"];
    oaci["openAIApiKey"] = params["apiKey"] || config.openaiApiKey;
    oaci["configuration"]["baseURL"] = params["baseURL"] || config.openaiBaseUrl;
    const model = new ChatOpenAI(oaci);
    if (!params["streaming"]) {
        return await model.invoke(chatHistory);
    } else {
        return await model.stream(chatHistory);
    }
}

export async function adaptOpenAIChatResponse(
    params: ChatModelParams,
    data: BaseMessage | string,
): Promise<schemas.CreateChatCompletionResponse> {
    let text = "";
    if (typeof data === "string") {
        text = data;
    } else if (data instanceof BaseMessage) {
        text = data.content.toString();
    }
    if (!params["streaming"]) {
        return {
            id: `chatcmpl-${Date.now()}`,
            choices: [
                {
                    message: {
                        "role": `assistant`,
                        "content": text,
                    },
                    finish_reason: "length",
                    index: 0,
                    logprobs: null,
                },
            ],
            created: Math.floor(Date.now() / 1000),
            model: params["modelName"] || "unkown",
            object: "chat.completion",
        };
    } else {
        return {
            id: `chatcmpl-${Date.now()}`,
            choices: [
                {
                    delta: {
                        "role": `assistant`,
                        "content": text,
                    },
                    finish_reason: "length",
                    index: 0,
                },
            ],
            created: Math.floor(Date.now() / 1000),
            model: params["modelName"] || "unkown",
            object: "chat.completion.chunk",
        };
    }
}

export function adaptOpenAIEmbeddingsResponse(
    params: EmbeddingsParams,
    data: number[] | number[][],
): schemas.CreateEmbeddingResponse {
    let embeddingData;
    if (Array.isArray(data[0])) {
        if (typeof data[0][0] == "number") {
            embeddingData = data.map((embeddingArray, index) => ({
                object: "embedding",
                embedding: embeddingArray,
                index: index,
            }));
        }
    } else {
        embeddingData = {
            object: "embedding",
            embedding: data,
            index: 0,
        };
    }
    return {
        "object": "list",
        // deno-lint-ignore ban-ts-comment
        // @ts-ignore
        "data": embeddingData,
        "model": params["modelName"] || "unkown",
    };
}

async function urlToBase64(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Failed to download image.");
    }
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const type = blob.type;
    const base64String = btoa(
        new Uint8Array(buffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), ""),
    );
    return `data:${type};base64,${base64String}`;
}
