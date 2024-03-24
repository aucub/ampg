import {
  BaseMessageChunk,
  Context,
  IterableReadableStream,
  Portkey,
} from "../deps.ts";
import { ChatModelParams, PortkeyModelParams } from "../types.ts";
import { IChatService } from "../types/i_service.ts";

export class PortkeyChatService implements IChatService {
  prepareModelParams(c: Context): Promise<ChatModelParams> {
    throw new Error("Method not implemented.");
  }

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

  deliverOutput(c: Context, output: any): Promise<Response> {
    throw new Error("Method not implemented.");
  }
}
