import {
  compress,
  cors,
  Hono,
  HTTPException,
  logger,
  OutputParserException,
  prettyJSON,
  secureHeaders,
  timing,
  ToolInputParsingException,
  zValidator,
} from "./deps.ts";
import { schemas as openaiSchemas } from "./types/schemas/openai.ts";
import { headersMiddleware } from "./middlewares/header_middleware.ts";
import { BaseModelParams, LangException } from "./types.ts";
import {
  OpenAIChatService,
  OpenAIEmbeddingService,
  OpenAIImageEditService,
  OpenAIImageGenerationService,
  OpenAITranscriptionService,
} from "./services/openai_service.ts";
import {
  getExceptionHandling,
  getModelService,
} from "./services/model_service_provider.ts";

const app = new Hono();

app.use(
  logger(),
  cors(),
  secureHeaders(),
  timing(),
  headersMiddleware(),
  compress(),
  prettyJSON(),
);

function createModelRequestHandler(
  serviceConstructor: any,
  serviceType: string,
) {
  return async (c) => {
    const serviceInstance = new serviceConstructor();
    const params = await serviceInstance.prepareModelParams(c);
    const dynamicService = getModelService(serviceType, params.provider ?? "");
    const output = await dynamicService.executeModel(c, params);
    return await serviceInstance.deliverOutput(c, output);
  };
}

app.post(
  "/v1/chat/completions",
  // @ts-ignore
  zValidator("json", openaiSchemas.CreateChatCompletionRequest),
  createModelRequestHandler(
    OpenAIChatService,
    "chat",
  ),
);

app.post(
  "/v1/embeddings",
  // @ts-ignore
  zValidator("json", openaiSchemas.CreateEmbeddingRequest),
  createModelRequestHandler(OpenAIEmbeddingService, "embedding"),
);

app.post(
  "/v1/images/edits",
  createModelRequestHandler(OpenAIImageEditService, "imageEdit"),
);

app.post(
  "/v1/images/generations",
  // @ts-ignore
  zValidator("json", openaiSchemas.CreateImageRequest),
  createModelRequestHandler(OpenAIImageGenerationService, "imageGeneration"),
);

app.post(
  "/v1/audio/transcriptions",
  createModelRequestHandler(OpenAITranscriptionService, "transcription"),
);

app.onError((err, c) => {
  console.error(`${err}`);
  let langException = err instanceof LangException ? err : new LangException();
  if (err instanceof ToolInputParsingException) {
    langException.message = err.message;
    langException.toolOutput = err.output;
  }
  if (err instanceof OutputParserException) {
    langException.message = err.message;
    langException.llmOutput = err.llmOutput;
    langException.observation = err.observation;
  }
  if (langException.message) {
    const params: BaseModelParams = c.get("params") || {};
    const exceptionHandling = getExceptionHandling(params.provider ?? "");
    return exceptionHandling.handleException(langException);
  }
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  return new HTTPException(500, { message: err.message }).getResponse();
});

export { app };
