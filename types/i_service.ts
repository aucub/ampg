import { BaseMessageChunk, Context, IterableReadableStream } from "../deps.ts";
import {
    BaseModelParams, ChatModelParams,
    EmbeddingParams,
    LangException
} from "../types.ts";

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