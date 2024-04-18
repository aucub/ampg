import {
  Ai,
  BaseMessageChunk,
  ChatCloudflareWorkersAI,
  CloudflareWorkersAIEmbeddings,
  CloudflareWorkersAIEmbeddingsParams,
  CloudflareWorkersAIInput,
  Context,
  Document,
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

export interface AIFetcherParams {
  cloudflareAccountId?: string;
  cloudflareApiToken?: string;
  baseUrl?: string;
}

class AIFetcher {
  cloudflareAccountId?: string;
  cloudflareApiToken?: string;
  baseUrl?: string;
  async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    const request = new Request(input, init);
    request.headers.delete("Host");
    request.headers.delete("Content-Length");
    request.headers.set("Authorization", "Bearer " + this.cloudflareApiToken);
    const res = await fetch(
      this.baseUrl + `/${this.cloudflareAccountId}/ai/run/proxy`,
      {
        method: "POST",
        headers: Object.fromEntries(request.headers.entries()),
        body: request.body,
      },
    );
    const respHeaders = new Headers(res.headers);
    respHeaders.delete("Host");
    respHeaders.delete("Content-Length");
    return new Response(res.body, { status: res.status, headers: respHeaders });
  }
  constructor(fields: AIFetcherParams) {
    this.cloudflareAccountId = fields?.cloudflareAccountId,
      this.cloudflareApiToken = fields?.cloudflareApiToken,
      this.baseUrl = fields?.baseUrl ??
      `https://api.cloudflare.com/client/v4/accounts`;
    if (this.baseUrl.endsWith("/")) {
      this.baseUrl = this.baseUrl.slice(0, -1);
    }
  }
}

export class CloudflareWorkersAIChatService extends AbstractChatService {
  async executeModel(
    c: Context,
    params: ChatModelParams,
  ): Promise<string | BaseMessageChunk | IterableReadableStream<any>> {
    const cloudflareWorkersAIInput: CloudflareWorkersAIInput = {
      ...params,
      cloudflareAccountId: params.user ||
        env<{ CLOUDFLARE_ACCOUNT_ID: string }>(c)["CLOUDFLARE_ACCOUNT_ID"],
      cloudflareApiToken: params.apiKey ||
        env<{ CLOUDFLARE_API_TOKEN: string }>(c)["CLOUDFLARE_API_TOKEN"],
      baseUrl: params.baseURL ||
        env<{ CLOUDFLARE_BASE_URL: string }>(c)["CLOUDFLARE_BASE_URL"],
    };
    const model = new ChatCloudflareWorkersAI(cloudflareWorkersAIInput);
    if (!params.streaming) {
      // @ts-ignore
      return await model.invoke(params.input);
    } else {
      return await model.stream(params.input);
    }
  }
}

export class CloudflareWorkersAIEmbeddingService
  extends AbstractEmbeddingService {
  async executeModel(
    c: Context,
    params: EmbeddingParams,
  ): Promise<number[] | number[][]> {
    const AI: AIFetcher = new AIFetcher({
      cloudflareAccountId: params.user ||
        env<{ CLOUDFLARE_ACCOUNT_ID: string }>(c)["CLOUDFLARE_ACCOUNT_ID"],
      cloudflareApiToken: params.apiKey ||
        env<{ CLOUDFLARE_API_TOKEN: string }>(c)["CLOUDFLARE_API_TOKEN"],
      baseUrl: env<{ CLOUDFLARE_BASE_URL: string }>(c)["CLOUDFLARE_BASE_URL"],
    });
    const cloudflareWorkersAIEmbeddingsParams:
      CloudflareWorkersAIEmbeddingsParams = {
      ...params,
      binding: AI,
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
    const AI: AIFetcher = new AIFetcher({
      cloudflareAccountId: params.user ||
        env<{ CLOUDFLARE_ACCOUNT_ID: string }>(c)["CLOUDFLARE_ACCOUNT_ID"],
      cloudflareApiToken: params.apiKey ||
        env<{ CLOUDFLARE_API_TOKEN: string }>(c)["CLOUDFLARE_API_TOKEN"],
      baseUrl: env<{ CLOUDFLARE_BASE_URL: string }>(c)["CLOUDFLARE_BASE_URL"],
    });
    const ai = new Ai(AI);
    const inputs = {
      //@ts-ignore
      audio: [...new Uint8Array(params.file)],
    };
    //@ts-ignore
    const response = await ai.run(params.model, inputs);
    //@ts-ignore
    return [new Document({ pageContent: response.text })];
  }
}

export class CloudflareWorkersAIImageEditService
  extends AbstractImageEditService {
  async executeModel(
    c: Context,
    params: ImageEditParams,
  ): Promise<string | Blob> {
    const AI: AIFetcher = new AIFetcher({
      cloudflareAccountId: params.user ||
        env<{ CLOUDFLARE_ACCOUNT_ID: string }>(c)["CLOUDFLARE_ACCOUNT_ID"],
      cloudflareApiToken: params.apiKey ||
        env<{ CLOUDFLARE_API_TOKEN: string }>(c)["CLOUDFLARE_API_TOKEN"],
      baseUrl: env<{ CLOUDFLARE_BASE_URL: string }>(c)["CLOUDFLARE_BASE_URL"],
    });
    const ai = new Ai(AI);
    const response = await ai.run(
      // @ts-ignore
      params.model,
      // @ts-ignore
      params as AiTextToImageInput,
    );
    // @ts-ignore
    return new Blob([response], { type: "image/png" });
  }
}
