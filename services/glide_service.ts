import {
  Context,
  MessageContent,
  MessageType,
} from "../deps.ts";
import { ChatModelParams, LangException } from "../types.ts";
import {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ErrorSchema,
} from "../types/schemas/glide.ts";
import { IChatService } from "../types/i_service.ts";


type StringWithAutocomplete<T> = T | (string & Record<never, never>);

type BaseMessageLikeComplex = [
  StringWithAutocomplete<MessageType | "user" | "assistant">,
  MessageContent,
];

export class GlideChatService implements IChatService {
  prepareModelParams(c: Context): Promise<ChatModelParams> {
    throw new Error("Method not implemented.");
  }
  async executeModel(c: Context, params: ChatModelParams): Promise<any> {
    const requestPayload = this.createChatRequest(params.input);
    const baseUrl = params["baseURL"] || c.env.GLIDE_BASE_URL;
    let response: Response | undefined;

    if (baseUrl) {
      response = await fetch(baseUrl + "/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });
    }

    if (response?.ok) {
      const responseData = await response.json();
      const validationResult = ChatResponse.safeParse(responseData);
      if (validationResult.success) {
        return responseData.modelResponse.message.content ?? null;
      }
    } else if (response && (response.status === 400 || response.status === 404)) {
      const errorData = await response.json();
      const validationResult = ErrorSchema.safeParse(errorData);
      if (validationResult.success) {
        throw new LangException(errorData.message);
      }
    }
  }
  deliverOutput(c: Context, output: any): Promise<Response> {
    throw new Error("Method not implemented.");
  }

  private createChatRequest(messages: BaseMessageLikeComplex[]): typeof ChatRequest {
    const userMessages = messages.filter(([role]) =>
      ["user", "human", "generic"].includes(role as string)
    ) as [MessageType, MessageContent][];
    const assistantMessages = messages.filter(([role]) =>
      ["assistant", "ai"].includes(role as string)
    ) as [MessageType, MessageContent][];

    const message: typeof ChatMessage = {
      content: userMessages[0][1],
      role: userMessages[0][0],
    };

    const messageHistory: typeof ChatMessage[] = [
      ...assistantMessages.map(([role, content]) => ({ content, role })),
      ...userMessages.slice(1).map(([role, content]) => ({ content, role })),
    ];

    return { message, messageHistory };
  }
}