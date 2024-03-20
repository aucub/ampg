import {
  BaseLanguageModelInput,
  MessageContent,
  MessageType,
  z,
} from "../deps.ts";
import { ChatModelParams, LangException } from "../types.ts";
import {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ErrorSchema,
} from "../types/glide.ts";

export async function langChatGlide(
  params: ChatModelParams,
  chatHistory: BaseLanguageModelInput,
) {
  const payload = adaptChatRequestGlide(chatHistory);
  let response: typeof ChatResponse;
  if (Deno.env.get("GLIDE_BASE_URL") || params["baseURL"]) {
    response = await fetch(
      Deno.env.get("GLIDE_BASE_URL") || params["baseURL"] + "/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
  }
  if (response && response.ok) {
    const data = await response
      .json();
    const validationResult = ChatResponse.safeParse(data);
    if (validationResult.success) {
      return data["modelResponse"]["message"]["content"] ?? null;
    }
  } else if (response.status == 400 || 404) {
    const data = await response
      .json();
    const validationResult = ErrorSchema.safeParse(data);
    if (validationResult.success) {
      throw new LangException(data.message);
    }
  }
}

type StringWithAutocomplete<T> = T | (string & Record<never, never>);

type BaseMessageLikeComplex = [
  StringWithAutocomplete<MessageType | "user" | "assistant">,
  MessageContent,
];

function adaptChatRequestGlide(
  data: BaseMessageLikeComplex[],
): typeof ChatRequest {
  const userMessages = data.filter(([role]) =>
    role === "user" || "human" || "generic"
  ) as [MessageType, MessageContent][];
  const assistantMessages = data.filter(([role]) =>
    role === "assistant" || "ai"
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
