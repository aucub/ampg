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
  validator,
  z,
  ZodSchema,
  zValidator,
} from "./deps.ts";
import { headersMiddleware } from "./middlewares/header_middleware.ts";
import { GatewayParams, GatewayParamsSchema, LangException } from "./types.ts";
import {
  getExceptionHandling,
  getModelService,
  getZodValidatorSchema,
} from "./services/model_service_provider.ts";
import { Provider, Target, TaskType } from "./config.ts";

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
    const modelService = getModelService(
      taskType,
      Provider[gatewayParams.model as keyof typeof Provider],
    );
    const params = await modelService.prepareModelParams(c);
    const providerService = getModelService(
      taskType,
      Provider[gatewayParams.provider as keyof typeof Provider],
    );
    const output = await providerService.executeModel(c, params);
    return await modelService.deliverOutput(c, output);
  };
}

Object.values(TaskType).forEach((taskType) => {
  const zodValidator = (target: Target) => validator(async (value, c) => {
    const gatewayParams: GatewayParams = c.req.query();
    try {
      const schema = getZodValidatorSchema(target, taskType, Provider[gatewayParams.provider as keyof typeof Provider])
      const result = await schema.safeParseAsync(value)
      if (!result.success) {
        return c.json(result, 400)
      }
      const data = result.data as z.infer<ZodSchema>
      return data
    } catch (error) {
      console.error(`${error}`);
      return null
    }
  });
  app.post("/api/" + [taskType], zValidator(Target.QUERY, GatewayParamsSchema), zodValidator(Target.JSON),
    zodValidator(Target.FORM),
    createModelRequestHandler(taskType));
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
      const exceptionHandling = getExceptionHandling(Provider[c.req.query('provider') as keyof typeof Provider]);
      return exceptionHandling.handleException(langException);
    }
    catch (error) {
      console.error(`${error}`);
    }
  }
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  return new HTTPException(500, { message: err.message }).getResponse();
});

export { app };
