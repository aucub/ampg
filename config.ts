import { configAsync } from "./deps.ts";

export enum TaskType {
  GENERATE = "generate",
  CHAT = "chat",
  EMBEDDINGS = "embeddings",
  AUDIO_TRANSCRIPTIONS = "audio/transcriptions",
  AUDIO_SPEECH = "audio/speech",
  AUDIO_TRANSLATIONS = "audio/translations",
  IMAGES_GENERATIONS = "images/generations",
  IMAGES_EDITS = "images/edits",
  IMAGES_VARIATIONS = "images/variations",
}

export enum Target {
  JSON = "json",
  FORM = "form",
  QUERY = "query",
  PARAM = "param",
  HEADER = "header",
  COOKIE = "cookie",
}

export enum Provider {
  OPEN_AI = "openai",
  GOOGLE = "google",
  WORKERS_AI = "workers-ai",
  HUGGINGFACE_INFERENCE = "huggingface-inference",
}

const secretMap = await configAsync();

for await (const [key, value] of Object.entries(secretMap)) {
  Deno.env.set(key, value);
}

export default secretMap;
