type StringOrNull = string | null;

interface BaseMessage {
    content: StringOrNull | ContentItem[];
    role: string;
    name?: string;
}

interface TextContentPart {
    type: string;
    text: string;
}

interface ImageContentPart {
    type: string;
    image_url: object;
}

type ContentItem = TextContentPart | ImageContentPart;

interface UserMessage extends BaseMessage {
    content: string | ContentItem[];
}

interface ToolCall {
    id: string;
    type: string;
    function: object;
}

interface AssistantMessage extends BaseMessage {
    tool_calls?: ToolCall[];
}

interface ToolMessage {
    role: string;
    content: StringOrNull;
    tool_call_id: string;
}

interface FunctionMessage extends BaseMessage {
    name: string;
}

type MessageItem = BaseMessage | UserMessage | AssistantMessage | ToolMessage | FunctionMessage;

interface LogitBias {
    [token: string]: number;
}

interface ResponseFormat {
    type: string;
}

interface FunctionChoice {
    type: string;
    function: object;
}

interface ChatObject {
    messages: MessageItem[];
    model: string;
    frequency_penalty?: number;
    logit_bias?: LogitBias;
    max_tokens?: number;
    n?: number;
    presence_penalty?: number;
    response_format?: ResponseFormat;
    seed?: number;
    stop?: StringOrNull | StringOrNull[];
    stream?: boolean;
    temperature?: number;
    top_p?: number;
    tools?: ToolCall[];
    tool_choice?: string | FunctionChoice;
    user?: string;
}

interface Usage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

interface Choice {
    finish_reason: string;
    logprobs: null;
    index: number;
    message: MessageItem;
}

interface ChatCompletionDelta {
    role: string;
    content: string;
}

interface ChoiceChunk {
    delta: ChatCompletionDelta;
    finish_reason: string | null;
    index: number;
}

export interface OpenAIChatResponse {
    id: string;
    object: "chat.completion";
    created: number;
    model: string;
    system_fingerprint?: string;
    choices: Choice[];
    usage?: Usage;
}

export interface OpenAIChatStreamingResponse {
    id: string;
    choices: ChoiceChunk[];
    created: number;
    model: string;
    system_fingerprint?: string;
    object: 'chat.completion.chunk';
    usage?: Usage;
}

export interface EmbeddingObjectResponse {
    object: string;
    model: string;
    usage?: Usage;
    data: EmbeddingData[];
}

type InputText = string | string[] | number[][];

interface EmbeddingObject {
    input: InputText;
    model: string;
    encoding_format?: 'float' | 'base64';
    user?: string;
}

interface EmbeddingData {
    index: number;
    embedding: number[];
    object: 'embedding';
}