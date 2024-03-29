import {
  BaseMessageChunk,
  Context,
  IterableReadableStream,
  Portkey,
} from "../deps.ts";
import { PortkeyModelParams } from "../types.ts";
import { AbstractChatService } from "../types/i_service.ts";

export class PortkeyChatService extends AbstractChatService {
  async executeModel(
    c: Context,
    params: PortkeyModelParams,
  ): Promise<string | BaseMessageChunk | IterableReadableStream<any>> {
    params.cache = undefined;
    const model = new Portkey(params);
    if (!params.streaming) {
      return await model.invoke(params.input);
    } else {
      return await model.stream(params.input);
    }
  }
}
