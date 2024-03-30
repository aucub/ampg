import {
  BaseMessageChunk,
  ChatCloudflareWorkersAI,
  CloudflareWorkersAIInput,
  Context,
  env,
  IterableReadableStream,
} from "../deps.ts";
import {
  ChatModelParams,
  EmbeddingParams,
  ImageEditParams,
  TranscriptionParams,
} from "../types.ts";
import {
  AbstractAudioTranscriptionService,
  AbstractChatService,
  AbstractEmbeddingService,
  AbstractImageEditService,
} from "../types/i_service.ts";
import {
  CloudflareWorkersAIEmbeddings,
  CloudflareWorkersAIEmbeddingsParams,
} from "../models/embeddings/cloudflare.ts";
import {
  CloudflareWorkersAIAudio,
  CloudflareWorkersAIAudioParams,
} from "../models/document_loaders/fs/cloudflare.ts";
import {
  CloudflareWorkersAIImageEditAPIWrapper,
  CloudflareWorkersAIImageEditAPIWrapperParams,
} from "../models/tools/cloudflare.ts";

export class CloudflareWorkersAIChatService extends AbstractChatService {
  async executeModel(
    c: Context,
    params: ChatModelParams,
  ): Promise<string | BaseMessageChunk | IterableReadableStream<any>> {
    const cloudflareWorkersAIInput: CloudflareWorkersAIInput = {
      ...params,
      model: params.modelName as string,
      cloudflareAccountId: params.user ||
        env<{ CLOUDFLARE_ACCOUNT_ID: string }>(c)["CLOUDFLARE_ACCOUNT_ID"],
      cloudflareApiToken: params.apiKey ||
        env<{ CLOUDFLARE_API_TOKEN: string }>(c)["CLOUDFLARE_API_TOKEN"],
    };
    const chatModel = new ChatCloudflareWorkersAI(cloudflareWorkersAIInput);
    if (!params.streaming) {
      // @ts-ignore
      return await chatModel.invoke(params.input);
    } else {
      return await chatModel.stream(params.input);
    }
  }
}

export class CloudflareWorkersAIEmbeddingService
  extends AbstractEmbeddingService {
  async executeModel(
    c: Context,
    params: EmbeddingParams,
  ): Promise<number[] | number[][]> {
    const cloudflareWorkersAIEmbeddingsParams:
      CloudflareWorkersAIEmbeddingsParams = {
        modelName: params.modelName,
        cloudflareAccountId: params.user ||
          env<{ CLOUDFLARE_ACCOUNT_ID: string }>(c)["CLOUDFLARE_ACCOUNT_ID"],
        cloudflareApiToken: params.apiKey ||
          env<{ CLOUDFLARE_API_TOKEN: string }>(c)["CLOUDFLARE_API_TOKEN"],
        baseUrl: env<{ CLOUDFLARE_BASE_URL: string }>(c)["CLOUDFLARE_BASE_URL"],
      };
    const embeddings = new CloudflareWorkersAIEmbeddings(
      cloudflareWorkersAIEmbeddingsParams,
    );
    if (Array.isArray(params.input)) {
      return await embeddings.embedDocuments(params.input);
    } else {
      return await embeddings.embedQuery(params.input as string);
    }
  }
}

export class CloudflareWorkersAITranscriptionService
  extends AbstractAudioTranscriptionService {
  async executeModel(c: Context, params: TranscriptionParams): Promise<any> {
    const cloudflareWorkersAIAudioParams: CloudflareWorkersAIAudioParams = {
      cloudflareAccountId: params.user,
      cloudflareApiToken: params.apiKey,
      modelName: params.modelName,
      baseUrl: env<{ CLOUDFLARE_BASE_URL: string }>(c)["CLOUDFLARE_BASE_URL"],
    };
    const audioLoader = new CloudflareWorkersAIAudio(
      params.file as Blob,
      cloudflareWorkersAIAudioParams,
    );
    return await audioLoader.load();
  }
}

export class CloudflareWorkersAIImageEditService
  extends AbstractImageEditService {
  async executeModel(
    c: Context,
    params: ImageEditParams,
  ): Promise<string | Blob> {
    const cloudflareWorkersAIImageEditAPIWrapperParams:
      CloudflareWorkersAIImageEditAPIWrapperParams = {
        guidance: params.guidance,
        num_steps: params.num_steps,
        prompt: params.prompt,
        strength: params.strength,
        image: params.image,
        mask: params.mask,
        baseUrl: await env<{ CLOUDFLARE_BASE_URL: string }>(
          c,
        )["CLOUDFLARE_BASE_URL"],
        cloudflareAccountId: params.user,
        cloudflareApiToken: params.apiKey,
        modelName: params.modelName,
      };
    const tool = new CloudflareWorkersAIImageEditAPIWrapper(
      cloudflareWorkersAIImageEditAPIWrapperParams,
    );
    return await tool.run();
  }
}
