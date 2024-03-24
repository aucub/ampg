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
import {
  BaseModelParams,
  ChatModelParams,
  EmbeddingParams,
  ImageEditParams,
  LangException,
  TranscriptionParams,
} from "./types.ts";
import { OpenAIChatService, OpenAIEmbeddingService, OpenAIImageEditService, OpenAITranscriptionService } from "./services/openai_service.ts";
import { getChatService, getEmbeddingService, getExceptionHandling, getImageEditService, getTranscriptionService } from "./services/model_service_provider.ts";

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


function createRequestHandler(serviceConstructor, prepareParamsMethod, executeModelMethod, deliverOutputMethod) {
  return async (c) => {
    const service = new serviceConstructor();
    let params = await service[prepareParamsMethod](c);
    const providerService = getService(params.provider ?? ""); // 假设`getService`是一个通用的服务查找函数
    const output = await providerService[executeModelMethod](c, params);
    return service[deliverOutputMethod](c, output);
  };
}

// 定义路由和处理函数
app.post("/v1/chat/completions", zValidator("json", openaiSchemas.CreateChatCompletionRequest), createRequestHandler(OpenAIChatService, 'prepareModelParams', 'executeModel', 'deliverOutput'));

app.post("/v1/embeddings", zValidator("json", openaiSchemas.CreateEmbeddingRequest), createRequestHandler(OpenAIEmbeddingService, 'prepareModelParams', 'executeModel', 'deliverOutput'));

app.post("/v1/images/edits", createRequestHandler(OpenAIImageEditService, 'prepareModelParams', 'executeModel', 'deliverOutput'));

app.post("/v1/audio/transcriptions", createRequestHandler(OpenAITranscriptionService, 'prepareModelParams', 'executeModel', 'deliverOutput'));


app.post(
  "/v1/chat/completions",
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  zValidator("json", openaiSchemas.CreateChatCompletionRequest),
  async (c) => {
    const openAIChatService = new OpenAIChatService();
    let params: ChatModelParams = await openAIChatService.prepareModelParams(c);
    const chatService = getChatService(params.provider ?? "")
    const output = await chatService.executeModel(c, params)
    return openAIChatService.deliverOutput(c, output)
  },
);

app.post(
  "/v1/embeddings",
  zValidator("json", openaiSchemas.CreateEmbeddingRequest),
  async (c) => {
    const openAIEmbeddingService = new OpenAIEmbeddingService();
    let params: EmbeddingParams = await openAIEmbeddingService.prepareModelParams(c);
    const embeddingService = getEmbeddingService(params.provider ?? "")
    const output = await embeddingService.executeModel(c, params)
    return openAIEmbeddingService.deliverOutput(c, output)
  }
);

app.post(
  "/v1/images/edits",
  async (c) => {
    const openAIImageEditService = new OpenAIImageEditService();
    let params: ImageEditParams = await openAIImageEditService.prepareModelParams(c);
    const imageEditService = getImageEditService(params.provider ?? "")
    const output = await imageEditService.executeModel(c, params)
    return openAIImageEditService.deliverOutput(c, output)
  },
);

app.post(
  "/v1/audio/transcriptions",
  async (c) => {
    const openAITranscriptionService = new OpenAITranscriptionService();
    let params: TranscriptionParams = await openAITranscriptionService.prepareModelParams(c);
    const transcriptionService = getTranscriptionService(params.provider ?? "")
    const output = await transcriptionService.executeModel(c, params)
    return openAITranscriptionService.deliverOutput(c, output)
  },
);

app.onError((err, c) => {
  console.error(`${err}`);
  let exception: LangException = new LangException();
  if (err instanceof ToolInputParsingException) {
    exception.message = err.message;
    exception.toolOutput = err.output;
  }
  if (err instanceof OutputParserException) {
    exception.message = err.message;
    exception.llmOutput = err.llmOutput;
    exception.observation = err.observation;
  }
  if (err instanceof LangException) {
    exception = err;
  }
  if (exception.message) {
    let params: BaseModelParams = c.get("params");
    const exceptionHandling = getExceptionHandling(params.provider ?? "")
    return exceptionHandling.handleException(exception);
  }
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  if (err instanceof Error) {
    const options = { message: err.message };
    return new HTTPException(500, options).getResponse();
  }
  return new HTTPException(500, { message: "unknown Error" }).getResponse();
});

export { app };
