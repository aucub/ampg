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
} from "../types.ts";
import {
  AbstractChatService,
} from "../types/i_service.ts";

export class CloudflareWorkersAIChatService extends AbstractChatService {
  async executeModel(
    c: Context,
    params: ChatModelParams,
  ): Promise<string | BaseMessageChunk | IterableReadableStream<any>> {
    const cloudflareWorkersAIInput: CloudflareWorkersAIInput = {
      ...params,
      model: params.model as string,
      cloudflareAccountId: params.user ||
        env<{ CLOUDFLARE_ACCOUNT_ID: string }>(c)["CLOUDFLARE_ACCOUNT_ID"],
      cloudflareApiToken: params.apiKey ||
        env<{ CLOUDFLARE_API_TOKEN: string }>(c)["CLOUDFLARE_API_TOKEN"],
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