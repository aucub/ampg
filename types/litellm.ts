import { makeApi, z, Zodios, type ZodiosOptions } from "../deps.ts";

const postChatcompletions_Body = z
  .object({
    model: z.string(),
    messages: z.array(
      z
        .object({
          role: z.string(),
          content: z.string(),
          name: z.string(),
          function_call: z.object({}).partial().passthrough(),
        })
        .partial()
        .passthrough(),
    ),
    functions: z.array(
      z
        .object({
          name: z.string(),
          description: z.string(),
          parameters: z.object({}).partial().passthrough(),
          function_call: z.string(),
        })
        .partial()
        .passthrough(),
    ),
    temperature: z.number(),
    top_p: z.number(),
    n: z.number().int(),
    stream: z.boolean(),
    stop: z.array(z.string()),
    max_tokens: z.number().int(),
    presence_penalty: z.number(),
    frequency_penalty: z.number(),
    logit_bias: z.object({}).partial().passthrough(),
    user: z.string(),
  })
  .partial()
  .passthrough();

export const schemas = {
  postChatcompletions_Body,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/",
    alias: "get",
    requestFormat: "json",
    response: z.void(),
  },
  {
    method: "post",
    path: "/chat/completions",
    alias: "postChatcompletions",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postChatcompletions_Body,
      },
    ],
    response: z
      .object({
        choices: z.array(
          z
            .object({
              finish_reason: z.string(),
              index: z.number().int(),
              message: z
                .object({ role: z.string(), content: z.string() })
                .partial()
                .passthrough(),
            })
            .partial()
            .passthrough(),
        ),
        created: z.string(),
        model: z.string(),
        usage: z
          .object({
            prompt_tokens: z.number().int(),
            completion_tokens: z.number().int(),
            total_tokens: z.number().int(),
          })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough(),
    errors: [
      {
        status: 500,
        description: `Server error`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/completions",
    alias: "postCompletions",
    requestFormat: "json",
    response: z.void(),
    errors: [
      {
        status: 500,
        description: `Server error`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/models",
    alias: "getModels",
    requestFormat: "json",
    response: z.void(),
  },
  {
    method: "get",
    path: "/ollama_logs",
    alias: "getOllama_logs",
    requestFormat: "json",
    response: z.void(),
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
