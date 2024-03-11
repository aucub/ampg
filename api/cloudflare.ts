import {
  BaseLanguageModelInput,
  ChatCloudflareWorkersAI,
  CloudflareWorkersAIInput,
} from "../deps.ts";
import config, { cloudflareWorkersTextGenerationModel } from "../config.ts";
import { ChatModelParams } from "../types.ts";

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
  cwai["cloudflareAccountId"] = params["user"] || config.cloudflareAccountId;
  cwai["cloudflareApiToken"] = params["apiKey"] || config.cloudflareApiToken;
  const model = new ChatCloudflareWorkersAI(cwai);
  if (!params["streaming"]) {
    return await model.invoke(chatHistory);
  } else {
    return await model.stream(chatHistory);
  }
}
