import {
  compress,
  cors,
  Hono,
  HTTPException,
  logger,
  OutputParserException,
  prettyJSON,
  qs,
  secureHeaders,
  timing,
  ToolInputParsingException,
  zValidator,
} from "./deps.ts";
import { headersMiddleware } from "./middlewares/header_middleware.ts";
import { GatewayParams, GatewayParamsSchema, LangException } from "./types.ts";
import {
  getExceptionHandling,
  getModelService,
} from "./services/model_service_provider.ts";
import { Provider, Target, TaskType } from "./config.ts";
import { validatorMiddleware } from "./middlewares/validator_middleware.ts";

const app = new Hono();

app.use(
  logger(),
  cors(),
  secureHeaders(),
  timing(),
  compress(),
  prettyJSON(),
);

function createModelRequestHandler(
  taskType: TaskType,
) {
  return async (c) => {
    const gatewayParams: GatewayParams = c.req.query();
    const modelService = getModelService(
      taskType,
      gatewayParams.model as Provider,
    );
    const params = await modelService.prepareModelParams(c);
    const providerService = getModelService(
      taskType,
      gatewayParams.provider as Provider,
    );
    const output = await providerService.executeModel(c, params);
    return await modelService.deliverOutput(c, output);
  };
}

Object.values(TaskType).forEach((taskType) => {
  app.post(
    "/api/" + [taskType],
    // @ts-ignore
    zValidator(Target.QUERY, GatewayParamsSchema),
    headersMiddleware(),
    validatorMiddleware(),
    createModelRequestHandler(taskType),
  );
});

app.all("/proxy/*", async (c) => {
  const urlString = "https://" +
    c.req.raw.url.toString().replace(/.*\/proxy\//, "");
  const url = new URL(urlString);
  url.searchParams.delete("route");
  const request = new Request(url, c.req.raw);
  const response = await fetch(request);
  const newResponse = new Response(response.body, response);
  return newResponse;
});

app.all("/portkey-ai/gateway", async (c) => {
  const queryString = new URL(c.req.url).search.slice(1);
  const gatewayParams = qs.parse(queryString);
  const url = new URL(gatewayParams.url as string);
  const rawRequest = c.req.raw;
  const headers = new Headers(rawRequest.headers);
  Object.entries(gatewayParams.options as Record<string, string>).forEach(
    ([key, value]) => {
      headers.set(key, value);
    },
  );
  const request = new Request(url, new Request(rawRequest, { headers }));
  const response = await fetch(request);
  const newResponse = new Response(response.body, response);
  return newResponse;
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
    try {
      const exceptionHandling = getExceptionHandling(
        c.req.query("model") as Provider,
      );
      return exceptionHandling.handleException(langException);
    } catch (error) {
      console.error(`${error}`);
    }
  }
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  return new HTTPException(500, { message: err.message }).getResponse();
});

export { app };
