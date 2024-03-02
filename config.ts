import { configAsync } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";

export const env = await configAsync();

interface Config {
    cloudflareAccountId: string | undefined;
    cloudflareApiToken: string | undefined;
    openaiBaseUrl: string | undefined;
    openaiApiKey: string | undefined;
    googleApiKey: string | undefined;
}

export const openAIModel: string[] = [
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
    "gpt-3.5-turbo-16k-0613"
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

export const cloudflareWorkersModel: string[] = [
    "@cf/qwen/qwen1.5-0.5b-chat",
    "@cf/huggingface/distilbert-sst-2-int8",
    "@hf/thebloke/llamaguard-7b-awq",
    "@hf/thebloke/neural-chat-7b-v3-1-awq",
    "@cf/deepseek-ai/deepseek-math-7b-base",
    "@cf/facebook/detr-resnet-50",
    "@cf/meta/llama-2-7b-chat-fp16",
    "@cf/mistral/mistral-7b-instruct-v0.1",
    "@cf/openai/whisper",
    "@cf/tinyllama/tinyllama-1.1b-chat-v1.0",
    "@hf/thebloke/orca-2-13b-awq",
    "@hf/thebloke/codellama-7b-instruct-awq",
    "@cf/runwayml/stable-diffusion-v1-5-inpainting",
    "@cf/thebloke/discolm-german-7b-v1-awq",
    "@cf/meta/llama-2-7b-chat-int8",
    "@hf/thebloke/mistral-7b-instruct-v0.1-awq",
    "@hf/thebloke/openchat_3.5-awq",
    "@cf/qwen/qwen1.5-7b-chat-awq",
    "@hf/thebloke/llama-2-13b-chat-awq",
    "@cf/microsoft/resnet-50",
    "@cf/bytedance/stable-diffusion-xl-lightning",
    "@hf/thebloke/deepseek-coder-6.7b-base-awq",
    "@cf/lykon/dreamshaper-8-lcm",
    "@cf/stabilityai/stable-diffusion-xl-base-1.0",
    "@cf/meta/detr-resnet-50",
    "@hf/thebloke/openhermes-2.5-mistral-7b-awq",
    "@cf/meta/m2m100-1.2b",
    "@hf/thebloke/deepseek-coder-6.7b-instruct-awq",
    "@hf/baai/bge-base-en-v1.5",
    "@cf/baai/bge-small-en-v1.5",
    "@cf/deepseek-ai/deepseek-math-7b-instruct",
    "@cf/tiiuae/falcon-7b-instruct",
    "@cf/baai/bge-base-en-v1.5",
    "@cf/unum/uform-gen2-qwen-500m",
    "@hf/thebloke/zephyr-7b-beta-awq",
    "@cf/qwen/qwen1.5-1.8b-chat",
    "@cf/defog/sqlcoder-7b-2",
    "@cf/microsoft/phi-2",
    "@cf/facebook/bart-large-cnn",
    "@cf/runwayml/stable-diffusion-v1-5-img2img",
    "@cf/qwen/qwen1.5-14b-chat-awq",
    "@cf/openchat/openchat-3.5-0106",
    "@cf/baai/bge-large-en-v1.5"
]


const config: Config = {
    cloudflareAccountId: Deno.env.get("CLOUDFLARE_ACCOUNT_ID") || env['CLOUDFLARE_ACCOUNT_ID'],
    cloudflareApiToken: Deno.env.get("CLOUDFLARE_API_TOKEN") || env['CLOUDFLARE_API_TOKEN'],
    openaiBaseUrl: Deno.env.get("OPENAI_BASE_URL") || env['OPENAI_BASE_URL'],
    openaiApiKey: Deno.env.get("OPENAI_API_KEY") || env['OPENAI_API_KEY'],
    googleApiKey: Deno.env.get("GOOGLE_API_KEY") || env['GOOGLE_API_KEY'],
};

export default config;
