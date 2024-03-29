import { Provider, Target } from "../config.ts";
import { MiddlewareHandler, z, ZodSchema } from "../deps.ts";
import { getZodValidatorSchema } from "../services/model_service_provider.ts";
import { GatewayParams } from "../types.ts";

export const validatorMiddleware = (): MiddlewareHandler => {
  return async function validatorMiddleware(c, next) {
    const taskType = c.req.path.replace(/^\/api\//, "");
    const gatewayParams: GatewayParams = c.req.query();
    let value;
    let target;
    let schema = getZodValidatorSchema(
      taskType,
      gatewayParams.model as Provider,
      Target.JSON,
    );
    if (schema) {
      value = await c.req.json();
      target = Target.JSON;
    } else {
      schema = getZodValidatorSchema(
        taskType,
        gatewayParams.model as Provider,
        Target.FORM,
      );
      if (schema) {
        value = await c.req.parseBody();
        target = Target.FORM;
      }
    }
    if (value) {
      const result = schema.safeParse(value);
      if (!result.success) {
        return c.json(result, 400);
      }
      const data = result.data as z.infer<ZodSchema>;
      c.req.addValidatedData(target, data as never);
    }
    await next();
  };
};
