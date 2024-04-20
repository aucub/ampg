import { Provider, Target, TaskType } from "./config.ts";
import {
  bearerAuth,
  compress,
  cors,
  Hono,
  HTTPException,
  logger,
  OutputParserException,
  parse,
  prettyJSON,
  qs,
  secureHeaders,
  timing,
  ToolInputParsingException,
  zValidator,
} from "./deps.ts";
import { headersMiddleware } from "./middlewares/header_middleware.ts";
import { validatorMiddleware } from "./middlewares/validator_middleware.ts";
import {
  getExceptionHandling,
  getModelService,
} from "./services/model_service_provider.ts";
import {
  BaseModelParams,
  GatewayParams,
  GatewayParamsSchema,
  LangException,
  RouterConfigSchema,
} from "./types.ts";

type Variables = {
  query: GatewayParams;
  params: BaseModelParams;
};

const app = new Hono<{ Variables: Variables }>();

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
    "/api/" + taskType,
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

const routeConfigEnv = Deno.env.get("ROUTE_CONFIG");
if (routeConfigEnv) {
  const config = parse(routeConfigEnv) as { token: string[]; routers: any[] };
  try {
    const validatedConfig = RouterConfigSchema.parse(config);
    for (const router of validatedConfig.routers) {
      // @ts-ignore
      app.use(
        router.router,
        bearerAuth({ token: validatedConfig.token }),
      );
      // @ts-ignore
      app.on(router.methods, router.router, async (c) => {
        const rawRequest = c.req.raw;
        const headers = new Headers(rawRequest.headers);
        for (const header of router.default_headers || []) {
          headers.set(header.name, header.value);
        }
        if (router.redirect) {
          const request = new Request(
            router.redirect,
            new Request(rawRequest, { headers }),
          );
          const response = await fetch(request);
          const newResponse = new Response(response.body, response);
          return newResponse;
        }
        return c.notFound();
      });
    }
  } catch (error) {
    console.error(`Error validating config file: ${error.message}`);
  }
}

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
