import { configAsync } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";

export const env = await configAsync();

interface Config {
    cloudflareAccountId: string | undefined;
    cloudflareApiToken: string | undefined;
    openaiBaseUrl: string | undefined;
    openaiApiKey: string | undefined;
    googleApiKey: string | undefined;
}

export const openAIChatModel: string[] = [
    "gpt-4-0125-preview",
    "gpt-4-turbo-preview",
    "gpt-4-1106-preview",
    "gpt-4-vision-preview",
    "gpt-4",
    "gpt-4-0314",
    "gpt-4-0613",
    "gpt-4-32k",
    "gpt-4-32k-0314",
    "gpt-4-32k-0613",
    "gpt-3.5-turbo",
    "gpt-3.5-turbo-16k",
    "gpt-3.5-turbo-0301",
    "gpt-3.5-turbo-0613",
    "gpt-3.5-turbo-1106",
    "gpt-3.5-turbo-0125",
    "gpt-3.5-turbo-16k-0613",
];

export const openAILegacyModel: string[] = [
    "gpt-3.5-turbo-instruct",
    "davinci-002",
    "babbage-002",
];

export const openAIImageModel: string[] = ["dall-e-2", "dall-e-3"];

export const openAIEmbeddingModel: string[] = [
    "text-embedding-ada-002",
    "text-embedding-3-small",
    "text-embedding-3-large",
];
export const openAITranscriptionModel: string[] = [
    "whisper-1",
];
export const openAITranslationModel: string[] = [
    "whisper-1",
];
export const openAISpeechModel: string[] = ["tts-1", "tts-1-hd"];
export const openAIModerationModel: string[] = [
    "text-moderation-latest",
    "text-moderation-stable",
];
export const openAIFineTuningModel: string[] = [
    "babbage-002",
    "davinci-002",
    "gpt-3.5-turbo",
];


export const openAIModel: string[] = [
    ...openAIChatModel,
    ...openAILegacyModel,
    ...openAIImageModel,
    ...openAIEmbeddingModel,
    ...openAITranscriptionModel,
    ...openAITranslationModel,
    ...openAISpeechModel,
    ...openAIModerationModel,
    ...openAIFineTuningModel
];

export const googleGenaiModel: string[] = [
    "gemini-pro",
    "gemini-1.0-pro-latest",
    "gemini-1.0-pro",
    "gemini-1.0-pro-001",
    "gemini-pro-vision",
    "embedding-001",
    "aqa",
];

export const cloudflareWorkersTextGenerationModel: string[] = [
    "@cf/qwen/qwen1.5-0.5b-chat",
    "@hf/thebloke/llamaguard-7b-awq",
    "@hf/thebloke/neural-chat-7b-v3-1-awq",
    "@cf/deepseek-ai/deepseek-math-7b-base",
    "@cf/meta/llama-2-7b-chat-fp16",
    "@cf/mistral/mistral-7b-instruct-v0.1",
    "@cf/tinyllama/tinyllama-1.1b-chat-v1.0",
    "@hf/thebloke/orca-2-13b-awq",
    "@hf/thebloke/codellama-7b-instruct-awq",
    "@cf/thebloke/discolm-german-7b-v1-awq",
    "@cf/meta/llama-2-7b-chat-int8",
    "@hf/thebloke/mistral-7b-instruct-v0.1-awq",
    "@hf/thebloke/openchat_3.5-awq",
    "@cf/qwen/qwen1.5-7b-chat-awq",
    "@hf/thebloke/llama-2-13b-chat-awq",
    "@hf/thebloke/deepseek-coder-6.7b-base-awq",
    "@cf/meta/detr-resnet-50",
    "@hf/thebloke/openhermes-2.5-mistral-7b-awq",
    "@hf/thebloke/deepseek-coder-6.7b-instruct-awq",
    "@cf/deepseek-ai/deepseek-math-7b-instruct",
    "@cf/tiiuae/falcon-7b-instruct",
    "@hf/thebloke/zephyr-7b-beta-awq",
    "@cf/qwen/qwen1.5-1.8b-chat",
    "@cf/defog/sqlcoder-7b-2",
    "@cf/microsoft/phi-2",
    "@cf/qwen/qwen1.5-14b-chat-awq",
    "@cf/openchat/openchat-3.5-0106",
    "@cf/mistral/mistral-7b-instruct-v0.1",
    "@hf/thebloke/mistral-7b-instruct-v0.1-awq",
];

export const cloudflareWorkersTranslationModel: string[] = [
    "@cf/meta/m2m100-1.2b",
];

export const cloudflareWorkersTextToImageModel: string[] = [
    "@cf/runwayml/stable-diffusion-v1-5-inpainting",
    "@cf/bytedance/stable-diffusion-xl-lightning",
    "@cf/lykon/dreamshaper-8-lcm",
    "@cf/stabilityai/stable-diffusion-xl-base-1.0",
    "@cf/runwayml/stable-diffusion-v1-5-img2img",
    "@cf/stabilityai/stable-diffusion-xl-base-1.0",
];

export const cloudflareWorkersTextEmbeddingsModel: string[] = [
    "@hf/baai/bge-base-en-v1.5",
    "@cf/baai/bge-small-en-v1.5",
    "@cf/baai/bge-base-en-v1.5",
    "@cf/baai/bge-large-en-v1.5",
];

export const cloudflareWorkersTextClassificationModel: string[] = [
    "@cf/huggingface/distilbert-sst-2-int8",
];

export const cloudflareWorkersASRModel: string[] = ["@cf/openai/whisper"];

export const cloudflareWorkersObjectDetectionModel: string[] = [
    "@cf/facebook/detr-resnet-50",
];

export const cloudflareWorkersImageClassificationModel: string[] = [
    "@cf/microsoft/resnet-50",
];

export const cloudflareWorkersImageToTextModel: string[] = [
    "@cf/unum/uform-gen2-qwen-500m",
];

export const cloudflareWorkersModel: string[] = [
    ...cloudflareWorkersTextGenerationModel,
    ...cloudflareWorkersImageClassificationModel,
    ...cloudflareWorkersObjectDetectionModel,
    ...cloudflareWorkersASRModel,
    ...cloudflareWorkersTextClassificationModel,
    ...cloudflareWorkersTextToImageModel,
    ...cloudflareWorkersTextEmbeddingsModel,
    ...cloudflareWorkersTranslationModel,
    ...cloudflareWorkersImageToTextModel
];


const config: Config = {
    cloudflareAccountId: Deno.env.get("CLOUDFLARE_ACCOUNT_ID") ||
        env["CLOUDFLARE_ACCOUNT_ID"],
    cloudflareApiToken: Deno.env.get("CLOUDFLARE_API_TOKEN") ||
        env["CLOUDFLARE_API_TOKEN"],
    openaiBaseUrl: Deno.env.get("OPENAI_BASE_URL") || env["OPENAI_BASE_URL"],
    openaiApiKey: Deno.env.get("OPENAI_API_KEY") || env["OPENAI_API_KEY"],
    googleApiKey: Deno.env.get("GOOGLE_API_KEY") || env["GOOGLE_API_KEY"],
};

export default config;
