import { openAIChatModel, openAIEmbeddingModel } from '../config.ts';
import { AIMessage, AzureOpenAIInput, BaseChatModelParams, BaseMessageLike, ChatOpenAI, ClientOptions, Context, DallEAPIWrapper, HumanMessage, IterableReadableStream, OpenAIChatInput, OpenAIEmbeddings, OpenAIEmbeddingsParams, OpenAIWhisperAudio, SystemMessage, isBaseMessage, isBaseMessageChunk, streamSSE, z } from '../deps.ts';
import { blobToBase64, isIterableReadableStream, urlToDataURL } from '../helpers/util.ts';
import { ChatModelParams, EmbeddingParams, ImageEditParams, ImageGenerationParams, LangException, TranscriptionParams, OpenAIError, BaseModelParams } from '../types.ts';
import { IChatService, IEmbeddingService, ITranscriptionService, IImageEditService, IExceptionHandling, IImageGenerationService } from '../types/i_service.ts'
import { schemas as openaiSchemas } from "../types/schemas/openai.ts";
import { assignProvider } from './model_service_provider.ts';

export class OpenAIChatService implements IChatService {
    async prepareModelParams(c: Context): Promise<ChatModelParams> {
        const params: Partial<ChatModelParams> = await c.get("params") ?? {};
        const body = c.req.valid("json");
        let mergedParams: ChatModelParams = {
            ...params,
            ...body,
            modelName: body["model"] || params["modelName"],
            streaming: body["stream"] || false,
            topP: body["top_p"],
            maxTokens: body["max_tokens"],
        };

        const chatHistory: BaseMessageLike[] = [];
        for (const message of body["messages"]) {
            const content = message["content"];
            const role = message["role"];
            if (Array.isArray(content)) {
                for (const contentPiece of content) {
                    if (contentPiece["type"] === "image_url" && typeof contentPiece["image_url"] === "string" && contentPiece["image_url"].startsWith("http")) {
                        contentPiece["image_url"] = await urlToDataURL(contentPiece["image_url"]);
                    }
                }
            }
            switch (role) {
                case "system":
                    chatHistory.push(new SystemMessage(content));
                    break;
                case "user":
                    chatHistory.push(new HumanMessage({ content }));
                    break;
                case "assistant":
                    chatHistory.push(new AIMessage(content as string));
                    break;
            }
        }
        mergedParams.input = chatHistory;
        mergedParams = assignProvider(mergedParams) as ChatModelParams;
        return mergedParams;
    }

    async executeModel(c: Context, chatModelParams: ChatModelParams): Promise<string | IterableReadableStream> {
        const openAIChatModelInput: Partial<OpenAIChatInput> & Partial<AzureOpenAIInput> & BaseChatModelParams = {
            cache: chatModelParams.cache ?? true,
            modelName: chatModelParams.modelName,
            openAIApiKey: chatModelParams.apiKey ?? c.env.OPENAI_API_KEY,
            configuration: {
                baseURL: c.env.OPENAI_BASE_URL ?? undefined,
            },
        };
        if (!openAIChatModel.includes(chatModelParams.modelName ?? "")) {
            openAIChatModelInput.modelName = undefined;
        }
        const openAIChatInput = { ...openAIChatModelInput, ...chatModelParams };
        const model = new ChatOpenAI(openAIChatInput);
        return chatModelParams.streaming ? model.stream(chatModelParams.input) : model.invoke(chatModelParams.input);
    }

    async deliverOutput(c: Context, output: string | IterableReadableStream): Promise<Response> {
        const params: Partial<ChatModelParams> = await c.get("params") ?? {};
        const modelName = params.modelName || "unknown";
        if (output instanceof IterableReadableStream || isIterableReadableStream(output)) {
            return await streamSSE(c, async (stream) => {
                for await (const chunk of output) {
                    if (chunk) {
                        await stream.writeSSE({
                            data: JSON.stringify(this.createCompletionChunk(chunk, modelName))
                        });
                    }
                }
                await stream.writeSSE({ data: "[DONE]" });
            });
        } else if (isBaseMessageChunk(output) || isBaseMessage(output)) {
            return c.json(this.createCompletion(output.content.toString(), modelName));
        } else if (typeof output === "string") {
            return c.json(this.createCompletion(output, modelName));
        } else {
            throw new Error('Output type is neither string nor IterableReadableStream.');
        }
    }

    createCompletionChunk(chunk: string, modelName: string) {
        return {
            id: `chatcmpl-${Date.now()}`,
            choices: [
                {
                    delta: {
                        "role": `assistant`,
                        "content": chunk || null,
                    },
                    finish_reason: "length",
                    index: 0,
                    logprobs: null,
                },
            ],
            created: Math.floor(Date.now() / 1000),
            model: modelName,
            object: "chat.completion.chunk",
        };
    }

    createCompletion(content: string, modelName: string) {
        return {
            id: `chatcmpl-${Date.now()}`,
            choices: [
                {
                    message: {
                        "role": `assistant`,
                        "content": content || null,
                    },
                    finish_reason: "length",
                    index: 0,
                    logprobs: null,
                },
            ],
            created: Math.floor(Date.now() / 1000),
            model: modelName,
            object: "chat.completion",
        };
    }

}


export class OpenAITranscriptionService implements ITranscriptionService {
    async prepareModelParams(c: Context): Promise<TranscriptionParams> {
        let params = await c.get("params") as TranscriptionParams;
        const formData = await c.req.parseBody({ all: true });
        const file = Array.isArray(formData['file']) ? formData['file'].pop() : formData['file'];
        const modelName = formData['model'];
        const responseFormat = formData['response_format'];
        if (file instanceof File) {
            params.file = file;
        } else {
            throw new Error("No file was provided or the provided file is invalid.");
        }
        if (typeof modelName === 'string') {
            params.modelName = modelName;
        } else {
            throw new Error("No model name was provided or the provided model name is invalid.");
        }
        if (typeof responseFormat === 'string') {
            params.response_format = responseFormat;
        } else {
            throw new Error("No response format was provided or the provided response format is invalid.");
        }
        params = assignProvider(params) as TranscriptionParams;
        return params;
    }

    async executeModel(c: Context, params: TranscriptionParams): Promise<z.infer<typeof openaiSchemas.CreateTranscriptionResponseJson>> {
        if (!(params.file instanceof Blob)) {
            throw new Error("The provided file must be a Blob.");
        }
        const clientOptions: ClientOptions = params as ClientOptions;
        try {
            const audioLoader = new OpenAIWhisperAudio(params.file, { clientOptions: clientOptions });
            const transcription = await audioLoader.load();
            const transcriptionResponse = openaiSchemas.CreateTranscriptionResponseJson.parse({
                "text": transcription.pageContent,
            });
            return transcriptionResponse;
        } catch (error) {
            console.error("Audio transcription failed:", error);
            throw new Error(`Audio transcription failed: ${error.message}`);
        }
    }

    deliverOutput(c: Context, output: any): Promise<Response> {
        return c.json(output);
    }

}


export class OpenAIImageEditService implements IImageEditService {
    async prepareModelParams(c: Context): Promise<ImageEditParams> {
        const defaultParams: ImageEditParams = {};
        let params: ImageEditParams = await c.get("params") ?? defaultParams;
        const formData = await c.req.parseBody();
        const fileFields = ['image', 'mask'];
        for (const field of fileFields) {
            if (formData[field] instanceof Blob) {
                params[field] = formData[field];
            } else {
                throw new Error(`The field '${field}' must be a Blob.`);
            }
        }
        const otherFields = ['prompt', 'model', 'n', 'size', 'response_format', 'user'];
        for (const field of otherFields) {
            if (formData[field]) {
                params[field] = formData[field];
            }
        }
        if (formData['model']) {
            params['modelName'] = formData['model'];
        }
        params = assignProvider(params) as ImageEditParams;
        return params;
    }

    executeModel(c: Context, params: ImageEditParams): Promise<string | Blob> {
        throw new Error('Method not implemented.');
    }
    async deliverOutput(c: Context, output: string | Blob): Promise<Response> {
        const params = c.get("params") as ImageEditParams;
        const currentTime = Math.floor(Date.now() / 1000);
        if (params.response_format === "url" && typeof output === "string") {
            return c.json({
                created: currentTime,
                data: [{ url: output }],
            });
        } else if (output instanceof Blob) {
            const b64Json = await blobToBase64(output);
            return c.json({
                created: currentTime,
                data: [{ b64_json: b64Json }],
            })
        } else {
            throw new Error(`Invalid output format`);
        }
    }
}


export class OpenAIEmbeddingService implements IEmbeddingService {
    async prepareModelParams(c: Context): Promise<EmbeddingParams> {
        const baseModelParams: BaseModelParams = await c.get("params");
        if (!baseModelParams) {
            throw new Error("Model parameters are not available in the context.");
        }
        const body = await c.req.valid("json");
        if (!body) {
            throw new Error("Invalid JSON in the request body.");
        }
        let embeddingParams: EmbeddingParams = {
            ...baseModelParams,
            ...body,
            modelName: body.model,
            input: body.input,
        };
        embeddingParams = assignProvider(embeddingParams) as EmbeddingParams;
        return embeddingParams;
    }

    async executeModel(c: Context, params: EmbeddingParams): Promise<number[] | number[][]> {
        const embeddingsParams: Partial<OpenAIEmbeddingsParams> = {
            ...params,
            openAIApiKey: params.apiKey || c.env.OPENAI_API_KEY,
            configuration: {
                baseURL: params.baseURL || c.env.OPENAI_BASE_URL,
            },
        };
        if (!openAIEmbeddingModel.includes(params.modelName ?? "")) {
            throw new Error(`Model name '${params.modelName}' is not supported.`);
        }
        const embeddings = new OpenAIEmbeddings(embeddingsParams);
        return Array.isArray(params.input)
            ? await embeddings.embedDocuments(params.input)
            : await embeddings.embedQuery(params.input);
    }

    async deliverOutput(c: Context, output: number[] | number[][]): Promise<Response> {
        const embeddingParams: EmbeddingParams = await c.get("params");
        if (!embeddingParams || typeof embeddingParams !== 'object' || !embeddingParams.modelName) {
            throw new Error("Embedding parameters are not available or invalid.");
        }
        let embeddingData;
        if (Array.isArray(output) && Array.isArray(output[0])) {
            // Multiple embeddings
            embeddingData = output.map((embeddingArray, index) => ({
                object: "embedding",
                embedding: embeddingArray,
                index: index,
            }));
        } else if (Array.isArray(output)) {
            // Single embedding
            embeddingData = [{
                object: "embedding",
                embedding: output,
                index: 0,
            }];
        } else {
            throw new Error("Invalid embedding output format.");
        }
        return c.json({
            object: "list",
            data: embeddingData,
            model: embeddingParams.modelName || "unknown",
        });
    }
}


export class OpenAIImageGenerationService implements IImageGenerationService {
    prepareModelParams(c: Context): Promise<ImageGenerationParams> {
        throw new Error('Method not implemented.');
    }
    async executeModel(c: Context, params: ImageGenerationParams) {
        const { apiKey, prompt } = params;
        const apiParams = {
            openAIApiKey: apiKey || c.env.OPENAI_API_KEY,
            responseFormat: params.response_format,
        };
        const tool = new DallEAPIWrapper(apiParams);
        try {
            return await tool.invoke(prompt);
        } catch (error) {
            console.error("An error occurred while invoking the Dall-E API:", error);
            throw new Error("Failed to execute the model for image generation.");
        }
    }

    deliverOutput(c: Context, output: string | Blob): Promise<Response> {
        throw new Error('Method not implemented.');
    }

}


export class OpenAIExceptionHandling implements IExceptionHandling {
    handleException(exception: LangException): Response {
        const error: OpenAIError = {
            code: 500,
            message: exception.message,
            param: null,
            type: 'generic',
        };
        if (exception.llmOutput) {
            error.type = "llm";
            error.param = JSON.stringify({
                llmOutput: exception.llmOutput,
                observation: exception.observation,
            });
        } else if (exception.toolOutput) {
            error.type = "tool";
            error.param = exception.toolOutput;
        }
        return new Response(JSON.stringify(error), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}