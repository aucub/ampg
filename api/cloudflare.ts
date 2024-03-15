import {
  BaseLanguageModelInput,
  ChatCloudflareWorkersAI,
  CloudflareWorkersAIInput,
  z,
} from "../deps.ts";
import secretMap, {
  cloudflareWorkersASRModel,
  cloudflareWorkersTextEmbeddingsModel,
  cloudflareWorkersTextGenerationModel,
} from "../config.ts";
import {
  ChatModelParams,
  ImagesEditsParams,
  EmbeddingsParams,
  TranscriptionParams,
  LangException,
} from "../types.ts";
import { schemas as openaiSchemas } from "../types/openai.ts";
import { schemas as cloudflareSchemas } from "../types/custom/cloudflare.ts";

if (!secretMap.CLOUDFLARE_BASE_URL) {
  secretMap.CLOUDFLARE_BASE_URL = "https://api.cloudflare.com/client/v4/accounts/";
}

export async function generateContentCloudflare(
  params: ChatModelParams,
  chatHistory: BaseLanguageModelInput,
) {
  const cloudflareWorkersAIInput: CloudflareWorkersAIInput = {
    ...params,
  } as CloudflareWorkersAIInput;
  if (!cloudflareWorkersTextGenerationModel.includes(cloudflareWorkersAIInput["model"] as string)) {
    cloudflareWorkersAIInput["model"] = "@cf/meta/llama-2-7b-chat-int8";
  }
  cloudflareWorkersAIInput["cloudflareAccountId"] = params["user"] || secretMap.CLOUDFLARE_ACCOUNT_ID;
  cloudflareWorkersAIInput["cloudflareApiToken"] = params["apiKey"] || secretMap.CLOUDFLARE_API_TOKEN;
  const model = new ChatCloudflareWorkersAI(cloudflareWorkersAIInput);
  if (!params["streaming"]) {
    return await model.invoke(chatHistory);
  } else {
    return await model.stream(chatHistory);
  }
}

export async function generateEmbeddingsCloudflare(
  params: EmbeddingsParams,
  texts: string[] | string,
) {
  if (
    !params["modelName"] ||
    !cloudflareWorkersTextEmbeddingsModel.includes(params["modelName"])
  ) {
    params["modelName"] = "@cf/baai/bge-large-en-v1.5";
  }
  let response;
  if (secretMap.CLOUDFLARE_BASE_URL && params["user"]) {
    response = await fetch(
      secretMap.CLOUDFLARE_BASE_URL + params["user"] + "/ai/run/" +
      params["modelName"],
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + params["apiKey"],
        },
        body: JSON.stringify({
          "text": texts,
        }),
      },
    );
  }
  if (response && response.ok) {
    const body: z.infer<typeof cloudflareSchemas.Response> = await response.json();
    if (!response || !response.ok || body["success"] != true) {
      console.log(response);
    }
    return body["result"]["data"] ?? null;
  }
}

export async function generateTranscriptionCloudflare(
  params: TranscriptionParams,
) {
  if (
    !params["modelName"] ||
    !cloudflareWorkersASRModel.includes(params["modelName"])
  ) {
    params["modelName"] = "@cf/openai/whisper";
  }
  let response;
  if (secretMap.CLOUDFLARE_BASE_URL && params["user"]) {
    response = await fetch(
      secretMap.CLOUDFLARE_BASE_URL + params["user"] + "/ai/run/" +
      params["modelName"],
      {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Authorization": "Bearer " + params["apiKey"],
        },
        body: await (params["file"]?.arrayBuffer() ?? null),
      },
    );
  }
  if (response && response.ok) {
    const body: z.infer<typeof cloudflareSchemas.Response> = await response.json();
    if (!response || !response.ok || body["success"] != true) {
      console.log(response);
    }
    const result = body["result"];
    const responseBody: z.infer<
      typeof openaiSchemas.CreateTranscriptionResponseVerboseJson
    > = {
      task: "transcribe",
      language: "unknown",
      duration: result["word_count"] as string,
      text: result["text"] as string,
      // deno-lint-ignore no-explicit-any
      words: (result["words"] as any[]).map((word: any) => ({
        word: word.word.toString(),
        start: word.start,
        end: word.end,
      })),
    };
    return responseBody;
  }

}

export async function generateImagesEditsCloudflare(
  params: ImagesEditsParams,
) {
  const imagesEditsParams = {
    guidance: params.guidance || 7.5,
    image: params.image instanceof File
      ? [...new Uint8Array(await params.image.arrayBuffer())]
      : undefined,
    mask: params.mask instanceof File
      ? [...new Uint8Array(await params.mask.arrayBuffer())]
      : undefined,
    num_steps: params.num_steps || 20,
    prompt: params.prompt || undefined,
    strength: params.strength || 1,
  };
  let response;
  if (secretMap.CLOUDFLARE_BASE_URL && params["user"]) {
    response = await fetch(
      secretMap.CLOUDFLARE_BASE_URL + params["user"] +
      "/ai/run/" + params["modelName"],
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + params["apiKey"],
        },
        body: await JSON.stringify(imagesEditsParams),
      },
    );
    if (response.headers.get("Content-Type")?.includes("image/")) {
      return await response.blob();
    } else {
      const body = await response.text();
      const langException: LangException = {
        name: "",
        message: ""
      }
      langException.message = body
      throw langException;
    }
  }
}
