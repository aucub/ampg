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
} from "./deps.ts";
import { headersMiddleware } from "./middlewares/header_middleware.ts";
import { BaseModelParams, GatewayParams, LangException } from "./types.ts";
import {
  getExceptionHandling,
  getModelService,
} from "./services/model_service_provider.ts";
import { Provider, TaskType } from "./config.ts";

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
  taskType: TaskType,
) {
  return async (c) => {
    const gatewayParams: GatewayParams = c.req.query();
    const modelService = getModelService(taskType, Provider[gatewayParams.model as keyof typeof Provider]);
    const params = await modelService.prepareModelParams(c);
    const providerService = getModelService(taskType, Provider[gatewayParams.provider as keyof typeof Provider]);
    const output = await providerService.executeModel(c, params);
    return await modelService.deliverOutput(c, output);
  };
}

Object.values(TaskType).forEach((taskType) => {
  app.post('/api/' + [taskType], createModelRequestHandler(taskType));
});

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
