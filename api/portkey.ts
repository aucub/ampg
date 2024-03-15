import { BaseLanguageModelInput, PortkeyChat } from "../deps.ts";
import { PortkeyModelParams } from "../types.ts";

export async function generateContentPortkey(
  params: PortkeyModelParams,
  chatHistory: BaseLanguageModelInput,
) {
  const ppc: Partial<PortkeyChat> = {};
  ppc.apiKey = params?.apiKey;
  ppc.baseURL = params?.baseURL;
  ppc.mode = params?.mode;
  ppc.llms = params.llms;
  const model = new PortkeyChat(ppc);
  if (!params["streaming"]) {
    return await model.invoke(chatHistory);
  } else {
    return await model.stream(chatHistory);
  }
}
