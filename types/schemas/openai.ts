import { makeApi, Zodios, type ZodiosOptions } from "../../deps.ts";
import { z } from "../../deps.ts";

const ChatCompletionRequestSystemMessage = z
  .object({
    content: z.string(),
    role: z.literal("system"),
    name: z.string().optional(),
  })
  .passthrough();
const ChatCompletionRequestMessageContentPartText = z
  .object({ type: z.literal("text"), text: z.string() })
  .passthrough();
const ChatCompletionRequestMessageContentPartImage = z
  .object({
    type: z.literal("image_url"),
    image_url: z
      .object({
        url: z.string().url(),
        detail: z.enum(["auto", "low", "high"]).optional().default("auto"),
      })
      .passthrough(),
  })
  .passthrough();
const ChatCompletionRequestMessageContentPart = z.union([
  ChatCompletionRequestMessageContentPartText,
  ChatCompletionRequestMessageContentPartImage,
]);
const ChatCompletionRequestUserMessage = z
  .object({
    content: z.union([
      z.string(),
      z.array(ChatCompletionRequestMessageContentPart),
    ]),
    role: z.literal("user"),
    name: z.string().optional(),
  })
  .passthrough();
const ChatCompletionMessageToolCall = z
  .object({
    id: z.string(),
    type: z.literal("function"),
    function: z
      .object({ name: z.string(), arguments: z.string() })
      .passthrough(),
  })
  .passthrough();
const ChatCompletionMessageToolCalls = z.array(ChatCompletionMessageToolCall);
const ChatCompletionRequestAssistantMessage = z
  .object({
    content: z.string().nullish(),
    role: z.literal("assistant"),
    name: z.string().optional(),
    tool_calls: ChatCompletionMessageToolCalls.optional(),
    function_call: z
      .object({ arguments: z.string(), name: z.string() })
      .passthrough()
      .optional(),
  })
  .passthrough();
const ChatCompletionRequestToolMessage = z
  .object({
    role: z.literal("tool"),
    content: z.string(),
    tool_call_id: z.string(),
  })
  .passthrough();
const ChatCompletionRequestFunctionMessage = z
  .object({
    role: z.literal("function"),
    content: z.string().nullable(),
    name: z.string(),
  })
  .passthrough();
const ChatCompletionRequestMessage = z.union([
  ChatCompletionRequestSystemMessage,
  ChatCompletionRequestUserMessage,
  ChatCompletionRequestAssistantMessage,
  ChatCompletionRequestToolMessage,
  ChatCompletionRequestFunctionMessage,
]);
const FunctionParameters = z.object({}).partial().passthrough();
const FunctionObject = z
  .object({
    description: z.string().optional(),
    name: z.string(),
    parameters: FunctionParameters.optional(),
  })
  .passthrough();
const ChatCompletionTool = z
  .object({ type: z.literal("function"), function: FunctionObject })
  .passthrough();
const ChatCompletionNamedToolChoice = z
  .object({
    type: z.literal("function"),
    function: z.object({ name: z.string() }).passthrough(),
  })
  .passthrough();
const ChatCompletionToolChoiceOption = z.union([
  z.enum(["none", "auto"]),
  ChatCompletionNamedToolChoice,
]);
const ChatCompletionFunctionCallOption = z
  .object({ name: z.string() })
  .passthrough();
const ChatCompletionFunctions = z
  .object({
    description: z.string().optional(),
    name: z.string(),
    parameters: FunctionParameters.optional(),
  })
  .passthrough();
const CreateChatCompletionRequest = z
  .object({
    messages: z.array(ChatCompletionRequestMessage).min(1),
    model: z.union([
      z.string(),
      z.enum([
        "gpt-4-turbo",
        "gpt-4-turbo-2024-04-09",
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
      ]),
    ]),
    frequency_penalty: z.number().gte(-2).lte(2).nullish(),
    logit_bias: z.record(z.number().int()).nullish(),
    logprobs: z.boolean().nullish(),
    top_logprobs: z.number().int().gte(0).lte(20).nullish(),
    max_tokens: z.number().int().nullish(),
    n: z.number().int().gte(1).lte(128).nullish().default(1),
    presence_penalty: z.number().gte(-2).lte(2).nullish(),
    response_format: z
      .object({ type: z.enum(["text", "json_object"]).default("text") })
      .partial()
      .passthrough()
      .optional(),
    seed: z
      .number()
      .int()
      .gte(-9223372036854776000)
      .lte(9223372036854776000)
      .nullish(),
    stop: z.union([z.string(), z.array(z.string())]).optional(),
    stream: z.boolean().nullish(),
    temperature: z.number().gte(0).lte(2).nullish().default(1),
    top_p: z.number().gte(0).lte(1).nullish().default(1),
    tools: z.array(ChatCompletionTool).optional(),
    tool_choice: ChatCompletionToolChoiceOption.optional(),
    user: z.string().optional(),
    function_call: z
      .union([z.enum(["none", "auto"]), ChatCompletionFunctionCallOption])
      .optional(),
    functions: z.array(ChatCompletionFunctions).min(1).max(128).optional(),
  })
  .passthrough();
const ChatCompletionResponseMessage = z
  .object({
    content: z.string().nullable(),
    tool_calls: ChatCompletionMessageToolCalls.optional(),
    role: z.literal("assistant"),
    function_call: z
      .object({ arguments: z.string(), name: z.string() })
      .passthrough()
      .optional(),
  })
  .passthrough();
const ChatCompletionTokenLogprob = z
  .object({
    token: z.string(),
    logprob: z.number(),
    bytes: z.array(z.number()).nullable(),
    top_logprobs: z.array(
      z
        .object({
          token: z.string(),
          logprob: z.number(),
          bytes: z.array(z.number()).nullable(),
        })
        .passthrough()
    ),
  })
  .passthrough();
const CompletionUsage = z
  .object({
    completion_tokens: z.number().int(),
    prompt_tokens: z.number().int(),
    total_tokens: z.number().int(),
  })
  .passthrough();
const CreateChatCompletionResponse = z
  .object({
    id: z.string(),
    choices: z.array(
      z
        .object({
          finish_reason: z.enum([
            "stop",
            "length",
            "tool_calls",
            "content_filter",
            "function_call",
          ]),
          index: z.number().int(),
          message: ChatCompletionResponseMessage,
          logprobs: z
            .object({ content: z.array(ChatCompletionTokenLogprob).nullable() })
            .passthrough()
            .nullable(),
        })
        .passthrough()
    ),
    created: z.number().int(),
    model: z.string(),
    system_fingerprint: z.string().optional(),
    object: z.literal("chat.completion"),
    usage: CompletionUsage.optional(),
  })
  .passthrough();
const CreateCompletionRequest = z
  .object({
    model: z.union([
      z.string(),
      z.enum(["gpt-3.5-turbo-instruct", "davinci-002", "babbage-002"]),
    ]),
    prompt: z
      .union([
        z.string(),
        z.array(z.string()),
        z.array(z.number()),
        z.array(z.array(z.number())),
      ])
      .nullable()
      .default("<|endoftext|>"),
    best_of: z.number().int().gte(0).lte(20).nullish().default(1),
    echo: z.boolean().nullish(),
    frequency_penalty: z.number().gte(-2).lte(2).nullish(),
    logit_bias: z.record(z.number().int()).nullish(),
    logprobs: z.number().int().gte(0).lte(5).nullish(),
    max_tokens: z.number().int().gte(0).nullish().default(16),
    n: z.number().int().gte(1).lte(128).nullish().default(1),
    presence_penalty: z.number().gte(-2).lte(2).nullish(),
    seed: z
      .number()
      .int()
      .gte(-9223372036854776000)
      .lte(9223372036854776000)
      .nullish(),
    stop: z.union([z.string(), z.array(z.string())]).nullish(),
    stream: z.boolean().nullish(),
    suffix: z.string().nullish(),
    temperature: z.number().gte(0).lte(2).nullish().default(1),
    top_p: z.number().gte(0).lte(1).nullish().default(1),
    user: z.string().optional(),
  })
  .passthrough();
const CreateCompletionResponse = z
  .object({
    id: z.string(),
    choices: z.array(
      z
        .object({
          finish_reason: z.enum(["stop", "length", "content_filter"]),
          index: z.number().int(),
          logprobs: z
            .object({
              text_offset: z.array(z.number()),
              token_logprobs: z.array(z.number()),
              tokens: z.array(z.string()),
              top_logprobs: z.array(z.record(z.number())),
            })
            .partial()
            .passthrough()
            .nullable(),
          text: z.string(),
        })
        .passthrough()
    ),
    created: z.number().int(),
    model: z.string(),
    system_fingerprint: z.string().optional(),
    object: z.literal("text_completion"),
    usage: CompletionUsage.optional(),
  })
  .passthrough();
const CreateImageRequest = z
  .object({
    prompt: z.string(),
    model: z
      .union([z.string(), z.enum(["dall-e-2", "dall-e-3"])])
      .nullish()
      .default("dall-e-2"),
    n: z.number().int().gte(1).lte(10).nullish().default(1),
    quality: z.enum(["standard", "hd"]).optional().default("standard"),
    response_format: z.enum(["url", "b64_json"]).nullish().default("url"),
    size: z
      .enum(["256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"])
      .nullish()
      .default("1024x1024"),
    style: z.enum(["vivid", "natural"]).nullish().default("vivid"),
    user: z.string().optional(),
  })
  .passthrough();
const Image = z
  .object({ b64_json: z.string(), url: z.string(), revised_prompt: z.string() })
  .partial()
  .passthrough();
const ImagesResponse = z
  .object({ created: z.number().int(), data: z.array(Image) })
  .passthrough();
const CreateImageEditRequest = z
  .object({
    image: z.instanceof(File),
    prompt: z.string(),
    mask: z.instanceof(File).optional(),
    model: z
      .union([z.string(), z.literal("dall-e-2")])
      .nullish()
      .default("dall-e-2"),
    n: z.number().int().gte(1).lte(10).nullish().default(1),
    size: z
      .enum(["256x256", "512x512", "1024x1024"])
      .nullish()
      .default("1024x1024"),
    response_format: z.enum(["url", "b64_json"]).nullish().default("url"),
    user: z.string().optional(),
  })
  .passthrough();
const CreateImageVariationRequest = z
  .object({
    image: z.instanceof(File),
    model: z
      .union([z.string(), z.literal("dall-e-2")])
      .nullish()
      .default("dall-e-2"),
    n: z.number().int().gte(1).lte(10).nullish().default(1),
    response_format: z.enum(["url", "b64_json"]).nullish().default("url"),
    size: z
      .enum(["256x256", "512x512", "1024x1024"])
      .nullish()
      .default("1024x1024"),
    user: z.string().optional(),
  })
  .passthrough();
const CreateEmbeddingRequest = z.object({
  input: z.union([
    z.string(),
    z.array(z.string()),
    z.array(z.number()),
    z.array(z.array(z.number())),
  ]),
  model: z.union([
    z.string(),
    z.enum([
      "text-embedding-ada-002",
      "text-embedding-3-small",
      "text-embedding-3-large",
    ]),
  ]),
  encoding_format: z.enum(["float", "base64"]).optional().default("float"),
  dimensions: z.number().int().gte(1).optional(),
  user: z.string().optional(),
});
const Embedding = z
  .object({
    index: z.number().int(),
    embedding: z.array(z.number()),
    object: z.literal("embedding"),
  })
  .passthrough();
const CreateEmbeddingResponse = z
  .object({
    data: z.array(Embedding),
    model: z.string(),
    object: z.literal("list"),
    usage: z
      .object({
        prompt_tokens: z.number().int(),
        total_tokens: z.number().int(),
      })
      .passthrough(),
  })
  .passthrough();
const CreateSpeechRequest = z.object({
  model: z.union([z.string(), z.enum(["tts-1", "tts-1-hd"])]),
  input: z.string().max(4096),
  voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]),
  response_format: z
    .enum(["mp3", "opus", "aac", "flac", "wav", "pcm"])
    .optional()
    .default("mp3"),
  speed: z.number().gte(0.25).lte(4).optional().default(1),
});
const CreateTranscriptionRequest = z.object({
  file: z.instanceof(File),
  model: z.union([z.string(), z.literal("whisper-1")]),
  language: z.string().optional(),
  prompt: z.string().optional(),
  response_format: z
    .enum(["json", "text", "srt", "verbose_json", "vtt"])
    .optional()
    .default("json"),
  temperature: z.number().optional(),
  "timestamp_granularities[]": z
    .array(z.enum(["word", "segment"]))
    .optional()
    .default(["segment"]),
});
const CreateTranscriptionResponseJson = z
  .object({ text: z.string() })
  .passthrough();
const TranscriptionWord = z
  .object({ word: z.string(), start: z.number(), end: z.number() })
  .passthrough();
const TranscriptionSegment = z
  .object({
    id: z.number().int(),
    seek: z.number().int(),
    start: z.number(),
    end: z.number(),
    text: z.string(),
    tokens: z.array(z.number()),
    temperature: z.number(),
    avg_logprob: z.number(),
    compression_ratio: z.number(),
    no_speech_prob: z.number(),
  })
  .passthrough();
const CreateTranscriptionResponseVerboseJson = z
  .object({
    language: z.string(),
    duration: z.string(),
    text: z.string(),
    words: z.array(TranscriptionWord).optional(),
    segments: z.array(TranscriptionSegment).optional(),
  })
  .passthrough();
const CreateTranslationRequest = z.object({
  file: z.instanceof(File),
  model: z.union([z.string(), z.literal("whisper-1")]),
  prompt: z.string().optional(),
  response_format: z.string().optional().default("json"),
  temperature: z.number().optional(),
});
const CreateTranslationResponseJson = z
  .object({ text: z.string() })
  .passthrough();
const CreateTranslationResponseVerboseJson = z
  .object({
    language: z.string(),
    duration: z.string(),
    text: z.string(),
    segments: z.array(TranscriptionSegment).optional(),
  })
  .passthrough();
const OpenAIFile = z
  .object({
    id: z.string(),
    bytes: z.number().int(),
    created_at: z.number().int(),
    filename: z.string(),
    object: z.literal("file"),
    purpose: z.enum([
      "fine-tune",
      "fine-tune-results",
      "assistants",
      "assistants_output",
    ]),
    status: z.enum(["uploaded", "processed", "error"]),
    status_details: z.string().optional(),
  })
  .passthrough();
const ListFilesResponse = z
  .object({ data: z.array(OpenAIFile), object: z.literal("list") })
  .passthrough();
const CreateFileRequest = z.object({
  file: z.instanceof(File),
  purpose: z.enum(["fine-tune", "assistants"]),
});
const DeleteFileResponse = z
  .object({ id: z.string(), object: z.literal("file"), deleted: z.boolean() })
  .passthrough();
const CreateFineTuningJobRequest = z
  .object({
    model: z.union([
      z.string(),
      z.enum(["babbage-002", "davinci-002", "gpt-3.5-turbo"]),
    ]),
    training_file: z.string(),
    hyperparameters: z
      .object({
        batch_size: z.union([z.literal("auto"), z.number()]).default("auto"),
        learning_rate_multiplier: z
          .union([z.literal("auto"), z.number()])
          .default("auto"),
        n_epochs: z.union([z.literal("auto"), z.number()]).default("auto"),
      })
      .partial()
      .passthrough()
      .optional(),
    suffix: z.string().min(1).max(40).nullish(),
    validation_file: z.string().nullish(),
    integrations: z
      .array(
        z
          .object({
            type: z.literal("wandb"),
            wandb: z
              .object({
                project: z.string(),
                name: z.string().nullish(),
                entity: z.string().nullish(),
                tags: z.array(z.string()).optional(),
              })
              .passthrough(),
          })
          .passthrough()
      )
      .nullish(),
    seed: z.number().int().gte(0).lte(2147483647).nullish(),
  })
  .passthrough();
const FineTuningIntegration = z
  .object({
    type: z.literal("wandb"),
    wandb: z
      .object({
        project: z.string(),
        name: z.string().nullish(),
        entity: z.string().nullish(),
        tags: z.array(z.string()).optional(),
      })
      .passthrough(),
  })
  .passthrough();
const FineTuningJob = z
  .object({
    id: z.string(),
    created_at: z.number().int(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        param: z.string().nullable(),
      })
      .passthrough()
      .nullable(),
    fine_tuned_model: z.string().nullable(),
    finished_at: z.number().int().nullable(),
    hyperparameters: z
      .object({
        n_epochs: z.union([z.literal("auto"), z.number()]).default("auto"),
      })
      .passthrough(),
    model: z.string(),
    object: z.literal("fine_tuning.job"),
    organization_id: z.string(),
    result_files: z.array(z.string()),
    status: z.enum([
      "validating_files",
      "queued",
      "running",
      "succeeded",
      "failed",
      "cancelled",
    ]),
    trained_tokens: z.number().int().nullable(),
    training_file: z.string(),
    validation_file: z.string().nullable(),
    integrations: z.array(FineTuningIntegration).max(5).nullish(),
    seed: z.number().int(),
  })
  .passthrough();
const ListPaginatedFineTuningJobsResponse = z
  .object({
    data: z.array(FineTuningJob),
    has_more: z.boolean(),
    object: z.literal("list"),
  })
  .passthrough();
const FineTuningJobEvent = z
  .object({
    id: z.string(),
    created_at: z.number().int(),
    level: z.enum(["info", "warn", "error"]),
    message: z.string(),
    object: z.literal("fine_tuning.job.event"),
  })
  .passthrough();
const ListFineTuningJobEventsResponse = z
  .object({ data: z.array(FineTuningJobEvent), object: z.literal("list") })
  .passthrough();
const FineTuningJobCheckpoint = z
  .object({
    id: z.string(),
    created_at: z.number().int(),
    fine_tuned_model_checkpoint: z.string(),
    step_number: z.number().int(),
    metrics: z
      .object({
        step: z.number(),
        train_loss: z.number(),
        train_mean_token_accuracy: z.number(),
        valid_loss: z.number(),
        valid_mean_token_accuracy: z.number(),
        full_valid_loss: z.number(),
        full_valid_mean_token_accuracy: z.number(),
      })
      .partial()
      .passthrough(),
    fine_tuning_job_id: z.string(),
    object: z.literal("fine_tuning.job.checkpoint"),
  })
  .passthrough();
const ListFineTuningJobCheckpointsResponse = z
  .object({
    data: z.array(FineTuningJobCheckpoint),
    object: z.literal("list"),
    first_id: z.string().nullish(),
    last_id: z.string().nullish(),
    has_more: z.boolean(),
  })
  .passthrough();
const createBatch_Body = z
  .object({
    input_file_id: z.string(),
    endpoint: z.literal("/v1/chat/completions"),
    completion_window: z.literal("24h"),
    metadata: z.record(z.string()).nullish(),
  })
  .passthrough();
const Batch = z
  .object({
    id: z.string(),
    object: z.literal("batch"),
    endpoint: z.string(),
    errors: z
      .object({
        object: z.string(),
        data: z.array(
          z
            .object({
              code: z.string(),
              message: z.string(),
              param: z.string().nullable(),
              line: z.number().int().nullable(),
            })
            .partial()
            .passthrough()
        ),
      })
      .partial()
      .passthrough()
      .optional(),
    input_file_id: z.string(),
    completion_window: z.string(),
    status: z.enum([
      "validating",
      "failed",
      "in_progress",
      "finalizing",
      "completed",
      "expired",
      "cancelling",
      "cancelled",
    ]),
    output_file_id: z.string().optional(),
    error_file_id: z.string().optional(),
    created_at: z.string(),
    in_progress_at: z.string().optional(),
    expires_at: z.string().optional(),
    finalizing_at: z.string().optional(),
    completed_at: z.string().optional(),
    failed_at: z.string().optional(),
    expired_at: z.string().optional(),
    cancelling_at: z.string().optional(),
    cancelled_at: z.string().optional(),
    request_counts: z
      .object({
        total: z.number().int(),
        completed: z.number().int(),
        failed: z.number().int(),
      })
      .passthrough()
      .optional(),
    metadata: z.object({}).partial().passthrough().nullish(),
  })
  .passthrough();
const Model = z
  .object({
    id: z.string(),
    created: z.number().int(),
    object: z.literal("model"),
    owned_by: z.string(),
  })
  .passthrough();
const ListModelsResponse = z
  .object({ object: z.literal("list"), data: z.array(Model) })
  .passthrough();
const DeleteModelResponse = z
  .object({ id: z.string(), deleted: z.boolean(), object: z.string() })
  .passthrough();
const CreateModerationRequest = z
  .object({
    input: z.union([z.string(), z.array(z.string())]),
    model: z
      .union([
        z.string(),
        z.enum(["text-moderation-latest", "text-moderation-stable"]),
      ])
      .optional()
      .default("text-moderation-latest"),
  })
  .passthrough();
const CreateModerationResponse = z
  .object({
    id: z.string(),
    model: z.string(),
    results: z.array(
      z
        .object({
          flagged: z.boolean(),
          categories: z
            .object({
              hate: z.boolean(),
              "hate/threatening": z.boolean(),
              harassment: z.boolean(),
              "harassment/threatening": z.boolean(),
              "self-harm": z.boolean(),
              "self-harm/intent": z.boolean(),
              "self-harm/instructions": z.boolean(),
              sexual: z.boolean(),
              "sexual/minors": z.boolean(),
              violence: z.boolean(),
              "violence/graphic": z.boolean(),
            })
            .passthrough(),
          category_scores: z
            .object({
              hate: z.number(),
              "hate/threatening": z.number(),
              harassment: z.number(),
              "harassment/threatening": z.number(),
              "self-harm": z.number(),
              "self-harm/intent": z.number(),
              "self-harm/instructions": z.number(),
              sexual: z.number(),
              "sexual/minors": z.number(),
              violence: z.number(),
              "violence/graphic": z.number(),
            })
            .passthrough(),
        })
        .passthrough()
    ),
  })
  .passthrough();
const AssistantToolsCode = z
  .object({ type: z.literal("code_interpreter") })
  .passthrough();
const AssistantToolsRetrieval = z
  .object({ type: z.literal("retrieval") })
  .passthrough();
const AssistantToolsFunction = z
  .object({ type: z.literal("function"), function: FunctionObject })
  .passthrough();
const AssistantObject = z
  .object({
    id: z.string(),
    object: z.literal("assistant"),
    created_at: z.number().int(),
    name: z.string().max(256).nullable(),
    description: z.string().max(512).nullable(),
    model: z.string(),
    instructions: z.string().max(256000).nullable(),
    tools: z
      .array(
        z.union([
          AssistantToolsCode,
          AssistantToolsRetrieval,
          AssistantToolsFunction,
        ])
      )
      .max(128)
      .default([]),
    file_ids: z.array(z.string()).max(20).default([]),
    metadata: z.object({}).partial().passthrough().nullable(),
  })
  .passthrough();
const ListAssistantsResponse = z
  .object({
    object: z.string(),
    data: z.array(AssistantObject),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const CreateAssistantRequest = z.object({
  model: z.union([
    z.string(),
    z.enum([
      "gpt-4-turbo",
      "gpt-4-turbo-2024-04-09",
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
      "gpt-3.5-turbo-0613",
      "gpt-3.5-turbo-1106",
      "gpt-3.5-turbo-0125",
      "gpt-3.5-turbo-16k-0613",
    ]),
  ]),
  name: z.string().max(256).nullish(),
  description: z.string().max(512).nullish(),
  instructions: z.string().max(256000).nullish(),
  tools: z
    .array(
      z.union([
        AssistantToolsCode,
        AssistantToolsRetrieval,
        AssistantToolsFunction,
      ])
    )
    .max(128)
    .optional()
    .default([]),
  file_ids: z.array(z.string()).max(20).optional().default([]),
  metadata: z.object({}).partial().passthrough().nullish(),
});
const ModifyAssistantRequest = z
  .object({
    model: z.string(),
    name: z.string().max(256).nullable(),
    description: z.string().max(512).nullable(),
    instructions: z.string().max(256000).nullable(),
    tools: z
      .array(
        z.union([
          AssistantToolsCode,
          AssistantToolsRetrieval,
          AssistantToolsFunction,
        ])
      )
      .max(128)
      .default([]),
    file_ids: z.array(z.string()).max(20).default([]),
    metadata: z.object({}).partial().passthrough().nullable(),
  })
  .partial();
const DeleteAssistantResponse = z
  .object({
    id: z.string(),
    deleted: z.boolean(),
    object: z.literal("assistant.deleted"),
  })
  .passthrough();
const CreateMessageRequest = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(256000),
  file_ids: z.array(z.string()).min(1).max(10).optional().default([]),
  metadata: z.object({}).partial().passthrough().nullish(),
});
const CreateThreadRequest = z
  .object({
    messages: z.array(CreateMessageRequest),
    metadata: z.object({}).partial().passthrough().nullable(),
  })
  .partial();
const ThreadObject = z
  .object({
    id: z.string(),
    object: z.literal("thread"),
    created_at: z.number().int(),
    metadata: z.object({}).partial().passthrough().nullable(),
  })
  .passthrough();
const ModifyThreadRequest = z
  .object({ metadata: z.object({}).partial().passthrough().nullable() })
  .partial();
const DeleteThreadResponse = z
  .object({
    id: z.string(),
    deleted: z.boolean(),
    object: z.literal("thread.deleted"),
  })
  .passthrough();
const MessageContentImageFileObject = z
  .object({
    type: z.literal("image_file"),
    image_file: z.object({ file_id: z.string() }).passthrough(),
  })
  .passthrough();
const MessageContentTextAnnotationsFileCitationObject = z
  .object({
    type: z.literal("file_citation"),
    text: z.string(),
    file_citation: z
      .object({ file_id: z.string(), quote: z.string() })
      .passthrough(),
    start_index: z.number().int().gte(0),
    end_index: z.number().int().gte(0),
  })
  .passthrough();
const MessageContentTextAnnotationsFilePathObject = z
  .object({
    type: z.literal("file_path"),
    text: z.string(),
    file_path: z.object({ file_id: z.string() }).passthrough(),
    start_index: z.number().int().gte(0),
    end_index: z.number().int().gte(0),
  })
  .passthrough();
const MessageContentTextObject = z
  .object({
    type: z.literal("text"),
    text: z
      .object({
        value: z.string(),
        annotations: z.array(
          z.union([
            MessageContentTextAnnotationsFileCitationObject,
            MessageContentTextAnnotationsFilePathObject,
          ])
        ),
      })
      .passthrough(),
  })
  .passthrough();
const MessageObject = z
  .object({
    id: z.string(),
    object: z.literal("thread.message"),
    created_at: z.number().int(),
    thread_id: z.string(),
    status: z.enum(["in_progress", "incomplete", "completed"]),
    incomplete_details: z
      .object({
        reason: z.enum([
          "content_filter",
          "max_tokens",
          "run_cancelled",
          "run_expired",
          "run_failed",
        ]),
      })
      .passthrough()
      .nullable(),
    completed_at: z.number().int().nullable(),
    incomplete_at: z.number().int().nullable(),
    role: z.enum(["user", "assistant"]),
    content: z.array(
      z.union([MessageContentImageFileObject, MessageContentTextObject])
    ),
    assistant_id: z.string().nullable(),
    run_id: z.string().nullable(),
    file_ids: z.array(z.string()).max(10).default([]),
    metadata: z.object({}).partial().passthrough().nullable(),
  })
  .passthrough();
const ListMessagesResponse = z
  .object({
    object: z.string(),
    data: z.array(MessageObject),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const ModifyMessageRequest = z
  .object({ metadata: z.object({}).partial().passthrough().nullable() })
  .partial();
const TruncationObject = z
  .object({
    type: z.enum(["auto", "last_messages"]),
    last_messages: z.number().int().gte(1).nullish(),
  })
  .passthrough();
const AssistantsApiNamedToolChoice = z
  .object({
    type: z.enum(["function", "code_interpreter", "retrieval"]),
    function: z.object({ name: z.string() }).passthrough().optional(),
  })
  .passthrough();
const AssistantsApiToolChoiceOption = z.union([
  z.enum(["none", "auto"]),
  AssistantsApiNamedToolChoice,
]);
const AssistantsApiResponseFormat = z
  .object({ type: z.enum(["text", "json_object"]).default("text") })
  .partial()
  .passthrough();
const AssistantsApiResponseFormatOption = z.union([
  z.enum(["none", "auto"]),
  AssistantsApiResponseFormat,
]);
const CreateThreadAndRunRequest = z.object({
  assistant_id: z.string(),
  thread: CreateThreadRequest.optional(),
  model: z
    .union([
      z.string(),
      z.enum([
        "gpt-4-turbo",
        "gpt-4-turbo-2024-04-09",
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
        "gpt-3.5-turbo-0613",
        "gpt-3.5-turbo-1106",
        "gpt-3.5-turbo-0125",
        "gpt-3.5-turbo-16k-0613",
      ]),
    ])
    .nullish(),
  instructions: z.string().nullish(),
  tools: z
    .array(
      z.union([
        AssistantToolsCode,
        AssistantToolsRetrieval,
        AssistantToolsFunction,
      ])
    )
    .max(20)
    .nullish(),
  metadata: z.object({}).partial().passthrough().nullish(),
  temperature: z.number().gte(0).lte(2).nullish().default(1),
  stream: z.boolean().nullish(),
  max_prompt_tokens: z.number().int().gte(256).nullish(),
  max_completion_tokens: z.number().int().gte(256).nullish(),
  truncation_strategy: TruncationObject.optional(),
  tool_choice: AssistantsApiToolChoiceOption.optional(),
  response_format: AssistantsApiResponseFormatOption.optional(),
});
const RunToolCallObject = z
  .object({
    id: z.string(),
    type: z.literal("function"),
    function: z
      .object({ name: z.string(), arguments: z.string() })
      .passthrough(),
  })
  .passthrough();
const RunCompletionUsage = z
  .object({
    completion_tokens: z.number().int(),
    prompt_tokens: z.number().int(),
    total_tokens: z.number().int(),
  })
  .passthrough();
const RunObject = z
  .object({
    id: z.string(),
    object: z.literal("thread.run"),
    created_at: z.number().int(),
    thread_id: z.string(),
    assistant_id: z.string(),
    status: z.enum([
      "queued",
      "in_progress",
      "requires_action",
      "cancelling",
      "cancelled",
      "failed",
      "completed",
      "expired",
    ]),
    required_action: z
      .object({
        type: z.literal("submit_tool_outputs"),
        submit_tool_outputs: z
          .object({ tool_calls: z.array(RunToolCallObject) })
          .passthrough(),
      })
      .passthrough()
      .nullable(),
    last_error: z
      .object({
        code: z.enum(["server_error", "rate_limit_exceeded", "invalid_prompt"]),
        message: z.string(),
      })
      .passthrough()
      .nullable(),
    expires_at: z.number().int().nullable(),
    started_at: z.number().int().nullable(),
    cancelled_at: z.number().int().nullable(),
    failed_at: z.number().int().nullable(),
    completed_at: z.number().int().nullable(),
    incomplete_details: z
      .object({
        reason: z.enum(["max_completion_tokens", "max_prompt_tokens"]),
      })
      .partial()
      .passthrough()
      .nullable(),
    model: z.string(),
    instructions: z.string(),
    tools: z
      .array(
        z.union([
          AssistantToolsCode,
          AssistantToolsRetrieval,
          AssistantToolsFunction,
        ])
      )
      .max(20)
      .default([]),
    file_ids: z.array(z.string()).default([]),
    metadata: z.object({}).partial().passthrough().nullable(),
    usage: RunCompletionUsage.nullable(),
    temperature: z.number().nullish(),
    max_prompt_tokens: z.number().int().gte(256).nullable(),
    max_completion_tokens: z.number().int().gte(256).nullable(),
    truncation_strategy: TruncationObject,
    tool_choice: AssistantsApiToolChoiceOption,
    response_format: AssistantsApiResponseFormatOption,
  })
  .passthrough();
const ListRunsResponse = z
  .object({
    object: z.string(),
    data: z.array(RunObject),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const CreateRunRequest = z.object({
  assistant_id: z.string(),
  model: z
    .union([
      z.string(),
      z.enum([
        "gpt-4-turbo",
        "gpt-4-turbo-2024-04-09",
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
        "gpt-3.5-turbo-0613",
        "gpt-3.5-turbo-1106",
        "gpt-3.5-turbo-0125",
        "gpt-3.5-turbo-16k-0613",
      ]),
    ])
    .nullish(),
  instructions: z.string().nullish(),
  additional_instructions: z.string().nullish(),
  additional_messages: z.array(CreateMessageRequest).nullish(),
  tools: z
    .array(
      z.union([
        AssistantToolsCode,
        AssistantToolsRetrieval,
        AssistantToolsFunction,
      ])
    )
    .max(20)
    .nullish(),
  metadata: z.object({}).partial().passthrough().nullish(),
  temperature: z.number().gte(0).lte(2).nullish().default(1),
  stream: z.boolean().nullish(),
  max_prompt_tokens: z.number().int().gte(256).nullish(),
  max_completion_tokens: z.number().int().gte(256).nullish(),
  truncation_strategy: TruncationObject.optional(),
  tool_choice: AssistantsApiToolChoiceOption.optional(),
  response_format: AssistantsApiResponseFormatOption.optional(),
});
const ModifyRunRequest = z
  .object({ metadata: z.object({}).partial().passthrough().nullable() })
  .partial();
const SubmitToolOutputsRunRequest = z.object({
  tool_outputs: z.array(
    z
      .object({ tool_call_id: z.string(), output: z.string() })
      .partial()
      .passthrough()
  ),
  stream: z.boolean().nullish(),
});
const RunStepDetailsMessageCreationObject = z
  .object({
    type: z.literal("message_creation"),
    message_creation: z.object({ message_id: z.string() }).passthrough(),
  })
  .passthrough();
const RunStepDetailsToolCallsCodeOutputLogsObject = z
  .object({ type: z.literal("logs"), logs: z.string() })
  .passthrough();
const RunStepDetailsToolCallsCodeOutputImageObject = z
  .object({
    type: z.literal("image"),
    image: z.object({ file_id: z.string() }).passthrough(),
  })
  .passthrough();
const RunStepDetailsToolCallsCodeObject = z
  .object({
    id: z.string(),
    type: z.literal("code_interpreter"),
    code_interpreter: z
      .object({
        input: z.string(),
        outputs: z.array(
          z.union([
            RunStepDetailsToolCallsCodeOutputLogsObject,
            RunStepDetailsToolCallsCodeOutputImageObject,
          ])
        ),
      })
      .passthrough(),
  })
  .passthrough();
const RunStepDetailsToolCallsRetrievalObject = z
  .object({
    id: z.string(),
    type: z.literal("retrieval"),
    retrieval: z.object({}).partial().passthrough(),
  })
  .passthrough();
const RunStepDetailsToolCallsFunctionObject = z
  .object({
    id: z.string(),
    type: z.literal("function"),
    function: z
      .object({
        name: z.string(),
        arguments: z.string(),
        output: z.string().nullable(),
      })
      .passthrough(),
  })
  .passthrough();
const RunStepDetailsToolCallsObject = z
  .object({
    type: z.literal("tool_calls"),
    tool_calls: z.array(
      z.union([
        RunStepDetailsToolCallsCodeObject,
        RunStepDetailsToolCallsRetrievalObject,
        RunStepDetailsToolCallsFunctionObject,
      ])
    ),
  })
  .passthrough();
const RunStepCompletionUsage = z
  .object({
    completion_tokens: z.number().int(),
    prompt_tokens: z.number().int(),
    total_tokens: z.number().int(),
  })
  .passthrough();
const RunStepObject = z
  .object({
    id: z.string(),
    object: z.literal("thread.run.step"),
    created_at: z.number().int(),
    assistant_id: z.string(),
    thread_id: z.string(),
    run_id: z.string(),
    type: z.enum(["message_creation", "tool_calls"]),
    status: z.enum([
      "in_progress",
      "cancelled",
      "failed",
      "completed",
      "expired",
    ]),
    step_details: z.union([
      RunStepDetailsMessageCreationObject,
      RunStepDetailsToolCallsObject,
    ]),
    last_error: z
      .object({
        code: z.enum(["server_error", "rate_limit_exceeded"]),
        message: z.string(),
      })
      .passthrough()
      .nullable(),
    expired_at: z.number().int().nullable(),
    cancelled_at: z.number().int().nullable(),
    failed_at: z.number().int().nullable(),
    completed_at: z.number().int().nullable(),
    metadata: z.object({}).partial().passthrough().nullable(),
    usage: RunStepCompletionUsage.nullable(),
  })
  .passthrough();
const ListRunStepsResponse = z
  .object({
    object: z.string(),
    data: z.array(RunStepObject),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const AssistantFileObject = z
  .object({
    id: z.string(),
    object: z.literal("assistant.file"),
    created_at: z.number().int(),
    assistant_id: z.string(),
  })
  .passthrough();
const ListAssistantFilesResponse = z
  .object({
    object: z.string(),
    data: z.array(AssistantFileObject),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const CreateAssistantFileRequest = z.object({ file_id: z.string() });
const DeleteAssistantFileResponse = z
  .object({
    id: z.string(),
    deleted: z.boolean(),
    object: z.literal("assistant.file.deleted"),
  })
  .passthrough();
const MessageFileObject = z
  .object({
    id: z.string(),
    object: z.literal("thread.message.file"),
    created_at: z.number().int(),
    message_id: z.string(),
  })
  .passthrough();
const ListMessageFilesResponse = z
  .object({
    object: z.string(),
    data: z.array(MessageFileObject),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();

export const schemas = {
  ChatCompletionRequestSystemMessage,
  ChatCompletionRequestMessageContentPartText,
  ChatCompletionRequestMessageContentPartImage,
  ChatCompletionRequestMessageContentPart,
  ChatCompletionRequestUserMessage,
  ChatCompletionMessageToolCall,
  ChatCompletionMessageToolCalls,
  ChatCompletionRequestAssistantMessage,
  ChatCompletionRequestToolMessage,
  ChatCompletionRequestFunctionMessage,
  ChatCompletionRequestMessage,
  FunctionParameters,
  FunctionObject,
  ChatCompletionTool,
  ChatCompletionNamedToolChoice,
  ChatCompletionToolChoiceOption,
  ChatCompletionFunctionCallOption,
  ChatCompletionFunctions,
  CreateChatCompletionRequest,
  ChatCompletionResponseMessage,
  ChatCompletionTokenLogprob,
  CompletionUsage,
  CreateChatCompletionResponse,
  CreateCompletionRequest,
  CreateCompletionResponse,
  CreateImageRequest,
  Image,
  ImagesResponse,
  CreateImageEditRequest,
  CreateImageVariationRequest,
  CreateEmbeddingRequest,
  Embedding,
  CreateEmbeddingResponse,
  CreateSpeechRequest,
  CreateTranscriptionRequest,
  CreateTranscriptionResponseJson,
  TranscriptionWord,
  TranscriptionSegment,
  CreateTranscriptionResponseVerboseJson,
  CreateTranslationRequest,
  CreateTranslationResponseJson,
  CreateTranslationResponseVerboseJson,
  OpenAIFile,
  ListFilesResponse,
  CreateFileRequest,
  DeleteFileResponse,
  CreateFineTuningJobRequest,
  FineTuningIntegration,
  FineTuningJob,
  ListPaginatedFineTuningJobsResponse,
  FineTuningJobEvent,
  ListFineTuningJobEventsResponse,
  FineTuningJobCheckpoint,
  ListFineTuningJobCheckpointsResponse,
  createBatch_Body,
  Batch,
  Model,
  ListModelsResponse,
  DeleteModelResponse,
  CreateModerationRequest,
  CreateModerationResponse,
  AssistantToolsCode,
  AssistantToolsRetrieval,
  AssistantToolsFunction,
  AssistantObject,
  ListAssistantsResponse,
  CreateAssistantRequest,
  ModifyAssistantRequest,
  DeleteAssistantResponse,
  CreateMessageRequest,
  CreateThreadRequest,
  ThreadObject,
  ModifyThreadRequest,
  DeleteThreadResponse,
  MessageContentImageFileObject,
  MessageContentTextAnnotationsFileCitationObject,
  MessageContentTextAnnotationsFilePathObject,
  MessageContentTextObject,
  MessageObject,
  ListMessagesResponse,
  ModifyMessageRequest,
  TruncationObject,
  AssistantsApiNamedToolChoice,
  AssistantsApiToolChoiceOption,
  AssistantsApiResponseFormat,
  AssistantsApiResponseFormatOption,
  CreateThreadAndRunRequest,
  RunToolCallObject,
  RunCompletionUsage,
  RunObject,
  ListRunsResponse,
  CreateRunRequest,
  ModifyRunRequest,
  SubmitToolOutputsRunRequest,
  RunStepDetailsMessageCreationObject,
  RunStepDetailsToolCallsCodeOutputLogsObject,
  RunStepDetailsToolCallsCodeOutputImageObject,
  RunStepDetailsToolCallsCodeObject,
  RunStepDetailsToolCallsRetrievalObject,
  RunStepDetailsToolCallsFunctionObject,
  RunStepDetailsToolCallsObject,
  RunStepCompletionUsage,
  RunStepObject,
  ListRunStepsResponse,
  AssistantFileObject,
  ListAssistantFilesResponse,
  CreateAssistantFileRequest,
  DeleteAssistantFileResponse,
  MessageFileObject,
  ListMessageFilesResponse,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/assistants",
    alias: "listAssistants",
    requestFormat: "json",
    parameters: [
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("desc"),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "before",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ListAssistantsResponse,
  },
  {
    method: "post",
    path: "/assistants",
    alias: "createAssistant",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateAssistantRequest,
      },
    ],
    response: AssistantObject,
  },
  {
    method: "get",
    path: "/assistants/:assistant_id",
    alias: "getAssistant",
    requestFormat: "json",
    parameters: [
      {
        name: "assistant_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: AssistantObject,
  },
  {
    method: "post",
    path: "/assistants/:assistant_id",
    alias: "modifyAssistant",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ModifyAssistantRequest,
      },
      {
        name: "assistant_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: AssistantObject,
  },
  {
    method: "delete",
    path: "/assistants/:assistant_id",
    alias: "deleteAssistant",
    requestFormat: "json",
    parameters: [
      {
        name: "assistant_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: DeleteAssistantResponse,
  },
  {
    method: "get",
    path: "/assistants/:assistant_id/files",
    alias: "listAssistantFiles",
    requestFormat: "json",
    parameters: [
      {
        name: "assistant_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("desc"),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "before",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z
      .object({
        object: z.string(),
        data: z.array(AssistantFileObject),
        first_id: z.string(),
        last_id: z.string(),
        has_more: z.boolean(),
      })
      .passthrough(),
  },
  {
    method: "post",
    path: "/assistants/:assistant_id/files",
    alias: "createAssistantFile",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ file_id: z.string() }),
      },
      {
        name: "assistant_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: AssistantFileObject,
  },
  {
    method: "get",
    path: "/assistants/:assistant_id/files/:file_id",
    alias: "getAssistantFile",
    requestFormat: "json",
    parameters: [
      {
        name: "assistant_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "file_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: AssistantFileObject,
  },
  {
    method: "delete",
    path: "/assistants/:assistant_id/files/:file_id",
    alias: "deleteAssistantFile",
    requestFormat: "json",
    parameters: [
      {
        name: "assistant_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "file_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: DeleteAssistantFileResponse,
  },
  {
    method: "post",
    path: "/audio/speech",
    alias: "createSpeech",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateSpeechRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/audio/transcriptions",
    alias: "createTranscription",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateTranscriptionRequest,
      },
    ],
    response: z.union([
      CreateTranscriptionResponseJson,
      CreateTranscriptionResponseVerboseJson,
    ]),
  },
  {
    method: "post",
    path: "/audio/translations",
    alias: "createTranslation",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateTranslationRequest,
      },
    ],
    response: z.union([
      CreateTranslationResponseJson,
      CreateTranslationResponseVerboseJson,
    ]),
  },
  {
    method: "post",
    path: "/batches",
    alias: "createBatch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: createBatch_Body,
      },
    ],
    response: Batch,
  },
  {
    method: "get",
    path: "/batches/:batch_id",
    alias: "retrieveBatch",
    requestFormat: "json",
    parameters: [
      {
        name: "batch_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: Batch,
  },
  {
    method: "post",
    path: "/batches/:batch_id/cancel",
    alias: "cancelBatch",
    requestFormat: "json",
    parameters: [
      {
        name: "batch_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: Batch,
  },
  {
    method: "post",
    path: "/chat/completions",
    alias: "createChatCompletion",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateChatCompletionRequest,
      },
    ],
    response: CreateChatCompletionResponse,
  },
  {
    method: "post",
    path: "/completions",
    alias: "createCompletion",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateCompletionRequest,
      },
    ],
    response: CreateCompletionResponse,
  },
  {
    method: "post",
    path: "/embeddings",
    alias: "createEmbedding",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateEmbeddingRequest,
      },
    ],
    response: CreateEmbeddingResponse,
  },
  {
    method: "get",
    path: "/files",
    alias: "listFiles",
    requestFormat: "json",
    parameters: [
      {
        name: "purpose",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ListFilesResponse,
  },
  {
    method: "post",
    path: "/files",
    alias: "createFile",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateFileRequest,
      },
    ],
    response: z
      .object({
        id: z.string(),
        bytes: z.number().int(),
        created_at: z.number().int(),
        filename: z.string(),
        object: z.literal("file"),
        purpose: z.enum([
          "fine-tune",
          "fine-tune-results",
          "assistants",
          "assistants_output",
        ]),
        status: z.enum(["uploaded", "processed", "error"]),
        status_details: z.string().optional(),
      })
      .passthrough(),
  },
  {
    method: "delete",
    path: "/files/:file_id",
    alias: "deleteFile",
    requestFormat: "json",
    parameters: [
      {
        name: "file_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: DeleteFileResponse,
  },
  {
    method: "get",
    path: "/files/:file_id",
    alias: "retrieveFile",
    requestFormat: "json",
    parameters: [
      {
        name: "file_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z
      .object({
        id: z.string(),
        bytes: z.number().int(),
        created_at: z.number().int(),
        filename: z.string(),
        object: z.literal("file"),
        purpose: z.enum([
          "fine-tune",
          "fine-tune-results",
          "assistants",
          "assistants_output",
        ]),
        status: z.enum(["uploaded", "processed", "error"]),
        status_details: z.string().optional(),
      })
      .passthrough(),
  },
  {
    method: "get",
    path: "/files/:file_id/content",
    alias: "downloadFile",
    requestFormat: "json",
    parameters: [
      {
        name: "file_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.string(),
  },
  {
    method: "post",
    path: "/fine_tuning/jobs",
    alias: "createFineTuningJob",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateFineTuningJobRequest,
      },
    ],
    response: FineTuningJob,
  },
  {
    method: "get",
    path: "/fine_tuning/jobs",
    alias: "listPaginatedFineTuningJobs",
    requestFormat: "json",
    parameters: [
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
    ],
    response: ListPaginatedFineTuningJobsResponse,
  },
  {
    method: "get",
    path: "/fine_tuning/jobs/:fine_tuning_job_id",
    alias: "retrieveFineTuningJob",
    requestFormat: "json",
    parameters: [
      {
        name: "fine_tuning_job_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: FineTuningJob,
  },
  {
    method: "post",
    path: "/fine_tuning/jobs/:fine_tuning_job_id/cancel",
    alias: "cancelFineTuningJob",
    requestFormat: "json",
    parameters: [
      {
        name: "fine_tuning_job_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: FineTuningJob,
  },
  {
    method: "get",
    path: "/fine_tuning/jobs/:fine_tuning_job_id/checkpoints",
    alias: "listFineTuningJobCheckpoints",
    requestFormat: "json",
    parameters: [
      {
        name: "fine_tuning_job_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
    ],
    response: ListFineTuningJobCheckpointsResponse,
  },
  {
    method: "get",
    path: "/fine_tuning/jobs/:fine_tuning_job_id/events",
    alias: "listFineTuningEvents",
    requestFormat: "json",
    parameters: [
      {
        name: "fine_tuning_job_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
    ],
    response: ListFineTuningJobEventsResponse,
  },
  {
    method: "post",
    path: "/images/edits",
    alias: "createImageEdit",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateImageEditRequest,
      },
    ],
    response: z
      .object({ created: z.number().int(), data: z.array(Image) })
      .passthrough(),
  },
  {
    method: "post",
    path: "/images/generations",
    alias: "createImage",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateImageRequest,
      },
    ],
    response: z
      .object({ created: z.number().int(), data: z.array(Image) })
      .passthrough(),
  },
  {
    method: "post",
    path: "/images/variations",
    alias: "createImageVariation",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateImageVariationRequest,
      },
    ],
    response: z
      .object({ created: z.number().int(), data: z.array(Image) })
      .passthrough(),
  },
  {
    method: "get",
    path: "/models",
    alias: "listModels",
    requestFormat: "json",
    response: ListModelsResponse,
  },
  {
    method: "get",
    path: "/models/:model",
    alias: "retrieveModel",
    requestFormat: "json",
    parameters: [
      {
        name: "model",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z
      .object({
        id: z.string(),
        created: z.number().int(),
        object: z.literal("model"),
        owned_by: z.string(),
      })
      .passthrough(),
  },
  {
    method: "delete",
    path: "/models/:model",
    alias: "deleteModel",
    requestFormat: "json",
    parameters: [
      {
        name: "model",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: DeleteModelResponse,
  },
  {
    method: "post",
    path: "/moderations",
    alias: "createModeration",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateModerationRequest,
      },
    ],
    response: CreateModerationResponse,
  },
  {
    method: "post",
    path: "/threads",
    alias: "createThread",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateThreadRequest,
      },
    ],
    response: ThreadObject,
  },
  {
    method: "get",
    path: "/threads/:thread_id",
    alias: "getThread",
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ThreadObject,
  },
  {
    method: "post",
    path: "/threads/:thread_id",
    alias: "modifyThread",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ metadata: z.object({}).partial().passthrough().nullable() })
          .partial(),
      },
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ThreadObject,
  },
  {
    method: "delete",
    path: "/threads/:thread_id",
    alias: "deleteThread",
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: DeleteThreadResponse,
  },
  {
    method: "get",
    path: "/threads/:thread_id/messages",
    alias: "listMessages",
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("desc"),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "before",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "run_id",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z
      .object({
        object: z.string(),
        data: z.array(MessageObject),
        first_id: z.string(),
        last_id: z.string(),
        has_more: z.boolean(),
      })
      .passthrough(),
  },
  {
    method: "post",
    path: "/threads/:thread_id/messages",
    alias: "createMessage",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateMessageRequest,
      },
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: MessageObject,
  },
  {
    method: "get",
    path: "/threads/:thread_id/messages/:message_id",
    alias: "getMessage",
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "message_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: MessageObject,
  },
  {
    method: "post",
    path: "/threads/:thread_id/messages/:message_id",
    alias: "modifyMessage",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ metadata: z.object({}).partial().passthrough().nullable() })
          .partial(),
      },
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "message_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: MessageObject,
  },
  {
    method: "get",
    path: "/threads/:thread_id/messages/:message_id/files",
    alias: "listMessageFiles",
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "message_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("desc"),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "before",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z
      .object({
        object: z.string(),
        data: z.array(MessageFileObject),
        first_id: z.string(),
        last_id: z.string(),
        has_more: z.boolean(),
      })
      .passthrough(),
  },
  {
    method: "get",
    path: "/threads/:thread_id/messages/:message_id/files/:file_id",
    alias: "getMessageFile",
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "message_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "file_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: MessageFileObject,
  },
  {
    method: "get",
    path: "/threads/:thread_id/runs",
    alias: "listRuns",
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("desc"),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "before",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ListRunsResponse,
  },
  {
    method: "post",
    path: "/threads/:thread_id/runs",
    alias: "createRun",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateRunRequest,
      },
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: RunObject,
  },
  {
    method: "get",
    path: "/threads/:thread_id/runs/:run_id",
    alias: "getRun",
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "run_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: RunObject,
  },
  {
    method: "post",
    path: "/threads/:thread_id/runs/:run_id",
    alias: "modifyRun",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ metadata: z.object({}).partial().passthrough().nullable() })
          .partial(),
      },
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "run_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: RunObject,
  },
  {
    method: "post",
    path: "/threads/:thread_id/runs/:run_id/cancel",
    alias: "cancelRun",
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "run_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: RunObject,
  },
  {
    method: "get",
    path: "/threads/:thread_id/runs/:run_id/steps",
    alias: "listRunSteps",
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "run_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("desc"),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "before",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z
      .object({
        object: z.string(),
        data: z.array(RunStepObject),
        first_id: z.string(),
        last_id: z.string(),
        has_more: z.boolean(),
      })
      .passthrough(),
  },
  {
    method: "get",
    path: "/threads/:thread_id/runs/:run_id/steps/:step_id",
    alias: "getRunStep",
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "run_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "step_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: RunStepObject,
  },
  {
    method: "post",
    path: "/threads/:thread_id/runs/:run_id/submit_tool_outputs",
    alias: "submitToolOuputsToRun",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SubmitToolOutputsRunRequest,
      },
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "run_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: RunObject,
  },
  {
    method: "post",
    path: "/threads/runs",
    alias: "createThreadAndRun",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateThreadAndRunRequest,
      },
    ],
    response: RunObject,
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
