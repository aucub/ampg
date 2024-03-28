import { BaseMessageChunk, Context, IterableReadableStream, z } from "../deps.ts";
import {
    BaseModelParams, ChatModelParams, ImageGenerationParams, EmbeddingParams, ImageEditParams,
    LangException, TranscriptionParams as AudioTranscriptionParams
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
 * Interface for chat service with specific parameter and result types.
 */
export interface IChatService extends IModelService<ChatModelParams, string | BaseMessageChunk | IterableReadableStream> {
}

/**
 * Interface for audio transcription service with specific parameter and result types.
 */
export interface IAudioTranscriptionService extends IModelService<AudioTranscriptionParams, z.infer<typeof openaiSchemas.CreateTranscriptionResponseVerboseJson> | z.infer<typeof openaiSchemas.CreateTranscriptionResponseJson> | z.infer<typeof openaiSchemas.CreateTranscriptionResponseJson>> {
}

/**
 * Interface for image editing service with specific parameter and result types.
 */
export interface IImageEditService extends IModelService<ImageEditParams, Blob | string> {
}


export interface IImageGenerationService extends IModelService<ImageGenerationParams, Blob | string> {
}

/**
 * Interface for embedding service with specific parameter and result types.
 */
export interface IEmbeddingService extends IModelService<EmbeddingParams, number[] | number[][]> {
}

/**
 * Interface for handling language exceptions and converting them to a standardized client error response.
 */
export interface IExceptionHandling {
    handleException(exception: LangException): Response;
}