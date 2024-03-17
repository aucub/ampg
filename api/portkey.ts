import { BaseLanguageModelInput, Portkey } from "../deps.ts";
import { PortkeyModelParams } from "../types.ts";

export async function chatCompletionPortkey(
  params: PortkeyModelParams,
  chatHistory: BaseLanguageModelInput,
) {
  const portkeyParams: Partial<Portkey> = {};
  portkeyParams.apiKey = params?.apiKey;
  portkeyParams.baseURL = params?.baseURL;
  portkeyParams.mode = params?.mode;
  const model = new Portkey(portkeyParams);
  if (!params["streaming"]) {
    return await model.invoke(chatHistory);
  } else {
    return await model.stream(chatHistory);
  }
}
