import {
  BaseLanguageModelInput,
  ChatCloudflareWorkersAI,
  CloudflareWorkersAIInput,
  z,
} from "../deps.ts";
import {
  cloudflareWorkersAISpeechRecognitionModel,
  cloudflareWorkersAITextEmbeddingsModel,
  cloudflareWorkersAITextGenerationModel,
} from "../config.ts";
import {
  ChatModelParams,
  EmbeddingParams,
  ImageEditParams,
  LangException,
  TranscriptionParams,
} from "../types.ts";
import { schemas as openaiSchemas } from "../types/openai.ts";
import { schemas as cloudflareSchemas } from "../types/custom/cloudflare.ts";

if (!Deno.env.get("CLOUDFLARE_BASE_URL")) {
  Deno.env.set(
    "CLOUDFLARE_BASE_URL",
    "https://api.cloudflare.com/client/v4/accounts/",
  );
}

export async function textGenerationCloudflare(
  params: ChatModelParams,
  chatHistory: BaseLanguageModelInput,
) {
  const cloudflareWorkersAIInput: CloudflareWorkersAIInput = {
    ...params,
  } as CloudflareWorkersAIInput;
  if (
    !cloudflareWorkersAITextGenerationModel.includes(
      cloudflareWorkersAIInput["model"] as string,
    )
  ) {
    cloudflareWorkersAIInput["model"] = "@cf/meta/llama-2-7b-chat-int8";
  }
  cloudflareWorkersAIInput["cloudflareAccountId"] = params["user"] ||
    Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
  cloudflareWorkersAIInput["cloudflareApiToken"] = params["apiKey"] ||
    Deno.env.get("CLOUDFLARE_API_TOKEN");
  const model = new ChatCloudflareWorkersAI(cloudflareWorkersAIInput);
  if (!params["streaming"]) {
    return await model.invoke(chatHistory);
  } else {
    return await model.stream(chatHistory);
  }
}

export async function textEmbeddingsCloudflare(
  params: EmbeddingParams,
  text: string[] | string,
) {
  if (
    !params["modelName"] ||
    !cloudflareWorkersAITextEmbeddingsModel.includes(params["modelName"])
  ) {
    params["modelName"] = "@cf/baai/bge-large-en-v1.5";
  }
  let response;
  if (Deno.env.get("CLOUDFLARE_BASE_URL") && params["user"]) {
    response = await fetch(
      Deno.env.get("CLOUDFLARE_BASE_URL") + params["user"] + "/ai/run/" +
        params["modelName"],
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + params["apiKey"],
        },
        body: JSON.stringify({
          "text": text,
        }),
      },
    );
  }
  if (response && response.ok) {
    const body: z.infer<typeof cloudflareSchemas.Response> = await response
      .json();
    if (body["success"] != true) {
      console.error("HTTP error:", response.status, response.statusText);
    }
    return body["result"]["data"] ?? null;
  }
}

export async function speechRecognitionCloudflare(
  params: TranscriptionParams,
) {
  if (
    !params["modelName"] ||
    !cloudflareWorkersAISpeechRecognitionModel.includes(params["modelName"])
  ) {
    params["modelName"] = "@cf/openai/whisper";
  }
  let response;
  if (Deno.env.get("CLOUDFLARE_BASE_URL") && params["user"]) {
    response = await fetch(
      Deno.env.get("CLOUDFLARE_BASE_URL") + params["user"] + "/ai/run/" +
        params["modelName"],
      {
        method: "POST",
        headers: {
          "Content-Type": params["file"].type,
          "Authorization": "Bearer " + params["apiKey"],
        },
        body: await params["file"],
      },
    );
  }
  if (response && response.ok) {
    const body: z.infer<typeof cloudflareSchemas.Response> = await response
      .json();
    if (body["success"] != true) {
      console.error("HTTP error:", response.status, response.statusText);
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
      words: await (result["words"] as any[]).map((word: any) => ({
        word: word.word as string,
        start: word.start,
        end: word.end,
      })),
    };
    return responseBody;
  }
}

export async function textToImageCloudflare(
  params: ImageEditParams,
) {
  const textToImageParams: any = {};
  if (params.guidance) {
    textToImageParams.guidance = params.guidance;
  }
  if (params.num_steps) {
    textToImageParams.num_steps = params.num_steps;
  }
  if (params.prompt) {
    textToImageParams.prompt = params.prompt;
  }
  if (params.strength) {
    textToImageParams.strength = params.strength;
  }
  if (params.image && params.image instanceof File) {
    textToImageParams.image = [
      ...new Uint8Array(await params.image.arrayBuffer()),
    ];
  }
  if (params.mask && params.mask instanceof File) {
    textToImageParams.mask = [
      ...new Uint8Array(await params.mask.arrayBuffer()),
    ];
  }
  let response;
  if (Deno.env.get("CLOUDFLARE_BASE_URL") && params["user"]) {
    response = await fetch(
      Deno.env.get("CLOUDFLARE_BASE_URL") + params["user"] +
        "/ai/run/" + params["modelName"],
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + params["apiKey"],
        },
        body: JSON.stringify(textToImageParams),
      },
    );
    if (response.headers.get("Content-Type")?.includes("image/")) {
      return await response.blob();
    } else {
      const body = await response.text();
      const langException: LangException = {
        name: "",
        message: "",
      };
      langException.message = body;
      throw langException;
    }
  }
}
