import {
  BaseLanguageModelInput,
  ChatCloudflareWorkersAI,
  CloudflareWorkersAIInput,
  z,
} from "../deps.ts";
import config, {
  cloudflareWorkersASRModel,
  cloudflareWorkersTextEmbeddingsModel,
  cloudflareWorkersTextGenerationModel,
} from "../config.ts";
import {
  ChatModelParams,
  EditImageParams,
  EmbeddingsParams,
  TranscriptionParams,
} from "../types.ts";
import { schemas as openaiSchemas } from "../types/openai.ts";

if (!config.CLOUDFLARE_BASE_URL) {
  config.CLOUDFLARE_BASE_URL = "https://api.cloudflare.com/client/v4/accounts/";
}

export async function generateCloudflareWorkers(
  params: ChatModelParams,
  chatHistory: BaseLanguageModelInput,
) {
  const cwai: CloudflareWorkersAIInput = {
    ...params,
  } as CloudflareWorkersAIInput;
  if (!cloudflareWorkersTextGenerationModel.includes(cwai["model"] as string)) {
    cwai["model"] = "@cf/meta/llama-2-7b-chat-int8";
  }
  cwai["cloudflareAccountId"] = params["user"] || config.CLOUDFLARE_API_ID;
  cwai["cloudflareApiToken"] = params["apiKey"] || config.CLOUDFLARE_API_TOKEN;
  const model = new ChatCloudflareWorkersAI(cwai);
  if (!params["streaming"]) {
    return await model.invoke(chatHistory);
  } else {
    return await model.stream(chatHistory);
  }
}

export async function generateEmbeddingsCloudflareWorkers(
  params: EmbeddingsParams,
  texts: string[] | string,
) {
  if (
    !params["modelName"] ||
    !cloudflareWorkersTextEmbeddingsModel.includes(params["modelName"])
  ) {
    params["modelName"] = "@cf/baai/bge-large-en-v1.5";
  }
  const resp = await fetch(
    config.CLOUDFLARE_BASE_URL + params["user"] + "/ai/run/" +
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
  const response = await resp.json();
  if (!resp.ok || response["success"] != true) {
    console.log(response);
  }
  return response["result"]["data"];
}

export async function generateTranscriptionCloudflareWorkers(
  params: TranscriptionParams,
) {
  if (
    !params["modelName"] ||
    !cloudflareWorkersASRModel.includes(params["modelName"])
  ) {
    params["modelName"] = "@cf/openai/whisper";
  }
  const resp = await fetch(
    config.CLOUDFLARE_BASE_URL + params["user"] + "/ai/run/" +
      params["modelName"],
    {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Authorization": "Bearer " + params["apiKey"],
      },
      body: await params["file"].arrayBuffer(),
    },
  );
  const response = await resp.json();
  if (!await resp.ok || await response["success"] != true) {
    console.log(response);
  }
  const result = await response["result"];
  const responseBody: z.infer<
    typeof openaiSchemas.CreateTranscriptionResponseVerboseJson
  > = await {
    task: "transcribe",
    language: "unknown",
    duration: result["word_count"],
    text: result["text"],
    words: result["words"].map((word) => ({
      word: word.word,
      start: word.start,
      end: word.end,
    })),
  };
  return await responseBody;
}

export async function generateEditImageCloudflareWorkers(
  params: EditImageParams,
) {
  const imageParams = await {
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
  const requestBody = await JSON.stringify(imageParams);
  const resp = await fetch(
    config.CLOUDFLARE_BASE_URL + params["user"] +
      "/ai/run/" + params["modelName"],
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + params["apiKey"],
      },
      body: requestBody,
    },
  );
  if (await resp.headers.get("Content-Type") == "image/png") {
    return await resp.blob();
  } else {
    const response = await resp.json();
    const encoder = await new TextEncoder();
    const data = await encoder.encode(JSON.stringify(response, null, 2));
    Deno.stdout.writeSync(await data);
  }
}
