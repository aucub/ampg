import { configAsync } from "./deps.ts";

interface CustomSecretMap {
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_BASE_URL?: string;
  OPENAI_BASE_URL?: string;
  HUGGINGFACEHUB_BASE_URL?: string;
}

interface CoreSecretMap {
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  PROMPTLAYER_API_KEY?: string;
  ZAPIER_NLA_API_KEY?: string;
}

interface CommunitySecretMap {
  ALIBABA_API_KEY?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRETE_ACCESS_KEY?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_SESSION_TOKEN?: string;
  AZURE_AISEARCH_ENDPOINT?: string;
  AZURE_AISEARCH_KEY?: string;
  AZURE_COSMOSDB_CONNECTION_STRING?: string;
  BAIDU_API_KEY?: string;
  BAIDU_SECRET_KEY?: string;
  BEDROCK_AWS_ACCESS_KEY_ID?: string;
  BEDROCK_AWS_SECRET_ACCESS_KEY?: string;
  CLOUDFLARE_API_TOKEN?: string;
  COHERE_API_KEY?: string;
  DATABERRY_API_KEY?: string;
  FIREWORKS_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  GOOGLE_PALM_API_KEY?: string;
  GOOGLE_PLACES_API_KEY?: string;
  GOOGLE_VERTEX_AI_WEB_CREDENTIALS?: string;
  GRADIENT_ACCESS_TOKEN?: string;
  GRADIENT_WORKSPACE_ID?: string;
  HUGGINGFACEHUB_API_KEY?: string;
  IBM_CLOUD_API_KEY?: string;
  IFLYTEK_API_KEY?: string;
  IFLYTEK_API_SECRET?: string;
  MILVUS_PASSWORD?: string;
  MILVUS_SSL?: string;
  MILVUS_USERNAME?: string;
  MINIMAX_API_KEY?: string;
  MINIMAX_GROUP_ID?: string;
  PLANETSCALE_DATABASE_URL?: string;
  PLANETSCALE_HOST?: string;
  PLANETSCALE_PASSWORD?: string;
  PLANETSCALE_USERNAME?: string;
  QDRANT_API_KEY?: string;
  QDRANT_URL?: string;
  REDIS_PASSWORD?: string;
  REDIS_URL?: string;
  REDIS_USERNAME?: string;
  REMOTE_RETRIEVER_AUTH_BEARER?: string;
  REPLICATE_API_TOKEN?: string;
  SEARXNG_API_BASE?: string;
  TOGETHER_AI_API_KEY?: string;
  TURBOPUFFER_API_KEY?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  UPSTASH_REDIS_REST_URL?: string;
  VECTARA_API_KEY?: string;
  VECTARA_CORPUS_ID?: string;
  VECTARA_CUSTOMER_ID?: string;
  WATSONX_PROJECT_ID?: string;
  WRITER_API_KEY?: string;
  WRITER_ORG_ID?: string;
  YC_API_KEY?: string;
  YC_IAM_TOKEN?: string;
  ZEP_API_KEY?: string;
  ZEP_API_URL?: string;
}

export type SecretMap = CoreSecretMap & CommunitySecretMap & CustomSecretMap;

export enum Providers {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  AZURE_OPENAI = "azure-openai",
  ANYSCALE = "anyscale",
  COHERE = "cohere",
  PALM = "palm",
  GOOGLE = "google",
  CLOUDFLARE = "cloudflare",
  AZUREOPENAI = "azureopenai",
  BEDROCK = "bedrock",
  CLIENTS = "clients",
  OCTOML = "octoml",
  OLLAMA = "ollama",
  TOGETHER_AI = "together-ai",
  PERPLEXITY_AI = "perplexity-ai",
  MISTRAL_AI = "mistral-ai",
  DEEPINFRA = "deepinfra",
  STABILITY_AI = "stability-ai",
  NOMIC = "nomic",
  AI21 = "ai21",
  GROQ = "groq",
  SEGMIND = "segmind",
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
  ...openAIFineTuningModel,
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

export const cloudflareWorkersAITextGenerationModel: string[] = [
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

export const cloudflareWorkersAITranslationModel: string[] = [
  "@cf/meta/m2m100-1.2b",
];

export const cloudflareWorkersAITextToImageModel: string[] = [
  "@cf/runwayml/stable-diffusion-v1-5-inpainting",
  "@cf/bytedance/stable-diffusion-xl-lightning",
  "@cf/lykon/dreamshaper-8-lcm",
  "@cf/stabilityai/stable-diffusion-xl-base-1.0",
  "@cf/runwayml/stable-diffusion-v1-5-img2img",
  "@cf/stabilityai/stable-diffusion-xl-base-1.0",
];

export const cloudflareWorkersAITextEmbeddingsModel: string[] = [
  "@hf/baai/bge-base-en-v1.5",
  "@cf/baai/bge-small-en-v1.5",
  "@cf/baai/bge-base-en-v1.5",
  "@cf/baai/bge-large-en-v1.5",
];

export const cloudflareWorkersAISentenceSimilarityModel: string[] = [
  "@hf/sentence-transformers/all-minilm-l6-v2 ",
  "@cf/inml/inml-roberta-dga",
  "@cf/jpmorganchase/roberta-spam",
];

export const cloudflareWorkersAITextClassificationModel: string[] = [
  "@cf/huggingface/distilbert-sst-2-int8",
];

export const cloudflareWorkersAISpeechRecognitionModel: string[] = [
  "@cf/openai/whisper",
  "@cf/openai/whisper-sherpa",
];

export const cloudflareWorkersAIObjectDetectionModel: string[] = [
  "@cf/facebook/detr-resnet-50",
];

export const cloudflareWorkersAIImageClassificationModel: string[] = [
  "@cf/microsoft/resnet-50",
];

export const cloudflareWorkersAIImageToTextModel: string[] = [
  "@cf/unum/uform-gen2-qwen-500m",
];

export const cloudflareWorkersAIModel: string[] = [
  ...cloudflareWorkersAITextGenerationModel,
  ...cloudflareWorkersAIImageClassificationModel,
  ...cloudflareWorkersAIObjectDetectionModel,
  ...cloudflareWorkersAISpeechRecognitionModel,
  ...cloudflareWorkersAITextClassificationModel,
  ...cloudflareWorkersAITextToImageModel,
  ...cloudflareWorkersAITextEmbeddingsModel,
  ...cloudflareWorkersAITranslationModel,
  ...cloudflareWorkersAIImageToTextModel,
  ...cloudflareWorkersAISentenceSimilarityModel,
];

const secretMap: SecretMap = await configAsync();

for await (const [key, value] of Object.entries(secretMap)) {
  Deno.env.set(key, value);
}

export default secretMap;

export const openAIPaths: string[] = [
  "/v1/chat/completions",
  "/v1/embeddings",
  "/v1/images/edits",
  "/v1/audio/transcriptions",
];
