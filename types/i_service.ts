import { BaseMessageChunk, Context, IterableReadableStream, z } from "../deps.ts";
import {
    TranscriptionParams as AudioTranscriptionParams,
    BaseModelParams, ChatModelParams,
    EmbeddingParams, ImageEditParams,
    ImageGenerationParams,
    LangException
} from "../types.ts";
import { schemas as openaiSchemas } from "../types/schemas/openai.ts";

/**
 * Base interface for model services with generic parameter and result types.
 */
export interface IModelService<TParams extends BaseModelParams, TOutput> {
    prepareModelParams(c: Context): Promise<TParams>;
    executeModel(c: Context, params: TParams): Promise<TOutput>;
    deliverOutput(c: Context, output: TOutput): Promise<Response>;
}

/**
 * Abstract class for chat service with specific parameter and result types.
 */
export abstract class AbstractChatService implements IModelService<ChatModelParams, string | BaseMessageChunk | IterableReadableStream> {
    async prepareModelParams(c: Context): Promise<ChatModelParams> {
        throw new Error("Method not implemented.");
    }
    async executeModel(c: Context, params: ChatModelParams): Promise<string | BaseMessageChunk | IterableReadableStream> {
        throw new Error("Method not implemented.");
    }
    async deliverOutput(c: Context, output: string | BaseMessageChunk | IterableReadableStream): Promise<Response> {
        throw new Error("Method not implemented.");
    }
}

/**
 * Abstract class for audio transcription service with specific parameter and result types.
 */
export abstract class AbstractAudioTranscriptionService implements IModelService<AudioTranscriptionParams, z.infer<typeof openaiSchemas.CreateTranscriptionResponseVerboseJson> | z.infer<typeof openaiSchemas.CreateTranscriptionResponseJson> | z.infer<typeof openaiSchemas.CreateTranscriptionResponseJson>> {
    async prepareModelParams(c: Context): Promise<AudioTranscriptionParams> {
        throw new Error("Method not implemented.");
    }
    async executeModel(c: Context, params: AudioTranscriptionParams): Promise<any> {
        throw new Error("Method not implemented.");
    }
    async deliverOutput(c: Context, output: any): Promise<Response> {
        throw new Error("Method not implemented.");
    }
}

/**
 * Abstract class for image editing service with specific parameter and result types.
 */
export abstract class AbstractImageEditService implements IModelService<ImageEditParams, Blob | string> {
    async prepareModelParams(c: Context): Promise<ImageEditParams> {
        throw new Error("Method not implemented.");
    }
    async executeModel(c: Context, params: ImageEditParams): Promise<string | Blob> {
        throw new Error("Method not implemented.");
    }
    async deliverOutput(c: Context, output: string | Blob): Promise<Response> {
        throw new Error("Method not implemented.");
    }
}


export abstract class AbstractImageGenerationService implements IModelService<ImageGenerationParams, Blob | string> {
    async prepareModelParams(c: Context): Promise<ImageGenerationParams> {
        throw new Error("Method not implemented.");
    }
    async executeModel(c: Context, params: ImageGenerationParams): Promise<string | Blob> {
        throw new Error("Method not implemented.");
    }
    async deliverOutput(c: Context, output: string | Blob): Promise<Response> {
        throw new Error("Method not implemented.");
    }
}

/**
 * Abstract class for embedding service with specific parameter and result types.
 */
export abstract class AbstractEmbeddingService implements IModelService<EmbeddingParams, number[] | number[][]> {
    async prepareModelParams(c: Context): Promise<EmbeddingParams> {
        throw new Error("Method not implemented.");
    }
    async executeModel(c: Context, params: EmbeddingParams): Promise<number[] | number[][]> {
        throw new Error("Method not implemented.");
    }
    async deliverOutput(c: Context, output: number[] | number[][]): Promise<Response> {
        throw new Error("Method not implemented.");
    }
}

/**
 * Interface for handling language exceptions and converting them to a standardized client error response.
 */
export interface IExceptionHandling {
    handleException(exception: LangException): Response;
}