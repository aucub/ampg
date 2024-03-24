import { IChatService, IEmbeddingService, IExceptionHandling, IImageEditService, IImageGenerationService, IModelService, ITranscriptionService } from "../types/i_service";
import { Providers, cloudflareWorkersAIModel, googleGenaiModel, openAIModel } from '../config.ts'
import { OpenAIChatService, OpenAIEmbeddingService, OpenAIExceptionHandling, OpenAIImageGenerationService, OpenAITranscriptionService } from "./openai_service.ts";
import { GoogleGenerativeAIChatService, GoogleGenerativeAIEmbeddingService } from "./google_genai_service.ts";
import { CloudflareWorkersAIChatService, CloudflareWorkersAIEmbeddingService, CloudflareWorkersAIImageEditService, CloudflareWorkersAITranscriptionService } from "./cloudflare_service.ts";
import { BaseModelParams } from "../types.ts";

function getProviderByModelName(modelName: string): Providers | undefined {
    if (openAIModel.includes(modelName)) {
        return Providers.OPENAI;
    } else if (googleGenaiModel.includes(modelName)) {
        return Providers.GOOGLE;
    } else if (cloudflareWorkersAIModel.includes(modelName)) {
        return Providers.CLOUDFLARE;
    }
    return undefined;
}

export function assignProvider(params: BaseModelParams): BaseModelParams {
    const { provider, modelName } = params;

    if (!provider || !Object.values(Providers).includes(params["provider"] as Providers)) {
        params.provider = modelName ? getProviderByModelName(modelName) : undefined;
    }

    return params;
}

const modelServiceConstructorMap = {
    chat: {
        [Providers.OPENAI]: OpenAIChatService,
        [Providers.GOOGLE]: GoogleGenerativeAIChatService,
        [Providers.CLOUDFLARE]: CloudflareWorkersAIChatService,
    },
    transcription: {
        [Providers.OPENAI]: OpenAITranscriptionService,
        [Providers.CLOUDFLARE]: CloudflareWorkersAITranscriptionService,
    },
    imageEdit: {
        [Providers.CLOUDFLARE]: CloudflareWorkersAIImageEditService,
    },
    imageGeneration: {
        [Providers.OPENAI]: OpenAIImageGenerationService,
    },
    embedding: {
        [Providers.OPENAI]: OpenAIEmbeddingService,
        [Providers.GOOGLE]: GoogleGenerativeAIEmbeddingService,
        [Providers.CLOUDFLARE]: CloudflareWorkersAIEmbeddingService,
    },
};

/**
 * 获取服务实例的通用函数。
 * 
 * @param serviceType 服务类型（例如："chat"、"transcription"）
 * @param provider 服务提供者（例如：Providers.OPENAI）
 * @returns 对应的服务实例
 */
export function getModelService(serviceType, provider) {
    const constructorMap = modelServiceConstructorMap[serviceType];
    if (!constructorMap) {
        throw new Error(`Unknown service type: ${serviceType}`);
    }

    const Constructor = constructorMap[provider];
    if (!Constructor) {
        throw new Error(`Unknown provider for service type ${serviceType}: ${provider}`);
    }

    return new Constructor();
}


export function getChatService(provider: string): IChatService {
    switch (provider) {
        case Providers.OPENAI:
            return new OpenAIChatService();
        case Providers.GOOGLE:
            return new GoogleGenerativeAIChatService();
        case Providers.CLOUDFLARE:
            return new CloudflareWorkersAIChatService();
        default:
            throw new Error(`Unknown chat service provider: ${provider}`);
    }
}

export function getTranscriptionService(provider: string): ITranscriptionService {
    switch (provider) {
        case Providers.OPENAI:
            return new OpenAITranscriptionService();
        case Providers.CLOUDFLARE:
            return new CloudflareWorkersAITranscriptionService();
        default:
            throw new Error(`Unknown transcription service provider: ${provider}`);
    }
}

export function getImageEditService(provider: string): IImageEditService {
    switch (provider) {
        case Providers.CLOUDFLARE:
            return new CloudflareWorkersAIImageEditService();
        default:
            throw new Error(`Unknown imageEdit service provider: ${provider}`);
    }
}

export function getImageGenerationService(provider: string): IImageGenerationService {
    switch (provider) {
        case Providers.OPENAI:
            return new OpenAIImageGenerationService();
        default:
            throw new Error(`Unknown imageGeneration service provider: ${provider}`);
    }
}

export function getEmbeddingService(provider: string): IEmbeddingService {
    switch (provider) {
        case Providers.OPENAI:
            return new OpenAIEmbeddingService();
        case Providers.GOOGLE:
            return new GoogleGenerativeAIEmbeddingService();
        case Providers.CLOUDFLARE:
            return new CloudflareWorkersAIEmbeddingService();
        default:
            throw new Error(`Unknown embedding service provider: ${provider}`);
    }
}

export function getExceptionHandling(provider: string): IExceptionHandling {
    switch (provider) {
        case Providers.OPENAI:
            return new OpenAIExceptionHandling();
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}