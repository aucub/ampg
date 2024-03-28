import {
  BaseMessageChunk,
  ChatCloudflareWorkersAI,
  CloudflareWorkersAIInput,
  Context,
  env,
  IterableReadableStream,
  z,
} from "../deps.ts";
import {
  cloudflareWorkersAISpeechRecognitionModel,
  cloudflareWorkersAITextEmbeddingsModel,
} from "../config.ts";
import {
  ChatModelParams,
  EmbeddingParams,
  ImageEditParams,
  TranscriptionParams,
} from "../types.ts";
import { schemas as cloudflareSchemas } from "../types/schemas/custom/cloudflare.ts";
import {
  IChatService,
  IEmbeddingService,
  IImageEditService,
  IAudioTranscriptionService,
} from "../types/i_service.ts";

const DEFAULT_CLOUDFLARE_BASE_URL =
  "https://api.cloudflare.com/client/v4/accounts/";

const DEFAULT_CLOUDFLAREWORKERSAI_CHAT_MODEL = "@cf/meta/llama-2-7b-chat-int8";

const DEFAULT_CLOUDFLAREWORKERSAI_EMBEDDING_MODEL =
  "@cf/baai/bge-large-en-v1.5";

const DEFAULT_CLOUDFLAREWORKERSAI_TRANSCRIPTION_MODEL = "@cf/openai/whisper";

export class CloudflareWorkersAIChatService implements IChatService {
  prepareModelParams(c: Context): Promise<ChatModelParams> {
    throw new Error("Method not implemented.");
  }
  async executeModel(
    c: Context,
    params: ChatModelParams,
  ): Promise<string | BaseMessageChunk | IterableReadableStream<any>> {
    const cloudflareWorkersAIInput: CloudflareWorkersAIInput = {
      ...params,
      model: cloudflareWorkersAITextEmbeddingsModel.includes(
          params.modelName as string,
        )
        ? params.modelName as string
        : DEFAULT_CLOUDFLAREWORKERSAI_CHAT_MODEL,
      cloudflareAccountId: params.user ||
        env<{ CLOUDFLARE_ACCOUNT_ID: string }>(c)["CLOUDFLARE_ACCOUNT_ID"],
      cloudflareApiToken: params.apiKey ||
        env<{ CLOUDFLARE_API_TOKEN: string }>(c)["CLOUDFLARE_API_TOKEN"],
    };
    const chatModel = new ChatCloudflareWorkersAI(cloudflareWorkersAIInput);
    try {
      if (!params.streaming) {
        return await chatModel.invoke(params.input);
      } else {
        return await chatModel.stream(params.input);
      }
    } catch (error) {
      console.error("An error occurred while executing the chat model:", error);
      throw error;
    }
  }
  deliverOutput(c: Context, output: any): Promise<Response> {
    throw new Error("Method not implemented.");
  }
}

export class CloudflareWorkersAIEmbeddingService implements IEmbeddingService {
  prepareModelParams(c: Context): Promise<EmbeddingParams> {
    throw new Error("Method not implemented.");
  }
  async executeModel(
    c: Context,
    params: EmbeddingParams,
  ): Promise<number[] | number[][]> {
    const modelName =
      cloudflareWorkersAITextEmbeddingsModel.includes(params.modelName ?? "")
        ? params.modelName
        : DEFAULT_CLOUDFLAREWORKERSAI_EMBEDDING_MODEL;
    const user = params.user;
    const apiKey = params.apiKey;
    const inputText = params.input;
    const baseUrl =
      env<{ CLOUDFLARE_BASE_URL: string }>(c)["CLOUDFLARE_BASE_URL"] ||
      DEFAULT_CLOUDFLARE_BASE_URL;
    if (!baseUrl || !user || !apiKey || !inputText) {
      throw new Error("Missing required parameters for embedding execution.");
    }
    const requestUrl = `${baseUrl}${user}/ai/run/${modelName}`;
    let response;
    try {
      response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ text: inputText }),
      });
    } catch (error) {
      console.error("Fetch operation failed:", error);
      throw error;
    }
    if (response.ok) {
      const body: z.infer<typeof cloudflareSchemas.Response> = await response
        .json();
      if (!body.success) {
        const errorMsg = JSON.stringify(body.error) ||
          "Unknown error occurred during embedding generation";
        console.error("Embedding generation error:", errorMsg);
        throw new Error(errorMsg);
      }
      return body.result.data as number[] | number[][] ?? null;
    } else {
      const statusText = response.statusText || "No response text";
      console.error("HTTP error:", response.status, statusText);
      throw new Error(`HTTP error: ${response.status} - ${statusText}`);
    }
  }
  deliverOutput(c: Context, output: number[] | number[][]): Promise<Response> {
    throw new Error("Method not implemented.");
  }
}

export class CloudflareWorkersAITranscriptionService
  implements IAudioTranscriptionService {
  prepareModelParams(c: Context): Promise<TranscriptionParams> {
    throw new Error("Method not implemented.");
  }
  async executeModel(c: Context, params: TranscriptionParams): Promise<any> {
    const modelName =
      cloudflareWorkersAISpeechRecognitionModel.includes(params.modelName ?? "")
        ? params.modelName
        : DEFAULT_CLOUDFLAREWORKERSAI_TRANSCRIPTION_MODEL;
    let response;
    const user = params.user;
    const apiKey = params.apiKey;
    const file = params.file;
    const baseUrl =
      env<{ CLOUDFLARE_BASE_URL: string }>(c)["CLOUDFLARE_BASE_URL"] ||
      DEFAULT_CLOUDFLARE_BASE_URL;
    if (baseUrl && user && file) {
      const requestUrl = `${baseUrl}${user}/ai/run/${modelName}`;
      try {
        response = await fetch(requestUrl, {
          method: "POST",
          headers: {
            "Content-Type": file.type,
            "Authorization": `Bearer ${apiKey}`,
          },
          body: file,
        });
      } catch (error) {
        console.error("Fetch operation failed:", error);
        throw error;
      }
      if (response.ok) {
        const body: z.infer<typeof cloudflareSchemas.Response> = await response
          .json();
        if (!body.success) {
          const errorMsg = JSON.stringify(body.error) ||
            "Unknown error occurred during transcription";
          console.error("Transcription error:", errorMsg);
          throw new Error(errorMsg);
        }
        const result = body.result;
        const transcriptionResult = {
          task: "transcribe",
          language: result.language || "unknown",
          duration: Number(result.word_count),
          text: result.text,
          words:
            (result.words as { start: number; end: number; word: string }[])
              ?.map((word) => ({
                word: word.word,
                start: word.start,
                end: word.end,
              })) ?? [],
        };
        return transcriptionResult;
      } else {
        const statusText = response.statusText || "No response text";
        console.error("HTTP error:", response.status, statusText);
        throw new Error(`HTTP error: ${response.status} - ${statusText}`);
      }
    } else {
      throw new Error("Base URL, user information, or file is missing.");
    }
  }
  deliverOutput(c: Context, output: any): Promise<Response> {
    throw new Error("Method not implemented.");
  }
}

export class CloudflareWorkersAIImageEditService implements IImageEditService {
  prepareModelParams(c: Context): Promise<ImageEditParams> {
    throw new Error("Method not implemented.");
  }
  async executeModel(
    c: Context,
    params: ImageEditParams,
  ): Promise<string | Blob> {
    const modelName = params.modelName;
    const user = params.user;
    const apiKey = params.apiKey;
    const baseUrl =
      await env<{ CLOUDFLARE_BASE_URL: string }>(c)["CLOUDFLARE_BASE_URL"] ||
      DEFAULT_CLOUDFLARE_BASE_URL;
    const imageEditParams = {
      guidance: params.guidance,
      num_steps: params.num_steps,
      prompt: params.prompt,
      strength: params.strength,
      image: params.image instanceof File
        ? Array.from(new Uint8Array(await params.image.arrayBuffer()))
        : undefined,
      mask: params.mask instanceof File
        ? Array.from(new Uint8Array(await params.mask.arrayBuffer()))
        : undefined,
    };
    let response;
    if (baseUrl && user) {
      const requestUrl = `${baseUrl}${user}/ai/run/${modelName}`;
      try {
        response = await fetch(requestUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify(imageEditParams),
        });
      } catch (error) {
        console.error("Fetch operation failed:", error);
        throw error;
      }
      if (response.ok) {
        if (response.headers.get("Content-Type")?.includes("image/")) {
          return await response.blob();
        } else {
          const body = await response.text();
          throw new Error(body);
        }
      } else {
        console.error("HTTP error:", response.status, response.statusText);
        throw new Error(
          `HTTP error: ${response.status} - ${response.statusText}`,
        );
      }
    } else {
      throw new Error("Base URL or user information is missing.");
    }
  }
  deliverOutput(c: Context, output: string | Blob): Promise<Response> {
    throw new Error("Method not implemented.");
  }
}
