import { app } from "../app.ts";
import { assertEquals, it, testClient } from "../deps.ts";
import { schemas as openaiSchemas } from "../types/openai.ts";
import { Providers } from "../config.ts";

it("POST /v1/chat/completions", async () => {
  const payload = {
    model: "gemini-pro",
    messages: [
      {
        "role": "system",
        "content": "You are a helpful assistant.",
      },
      {
        "role": "user",
        "content": "Hello!",
      },
    ],
  };
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  const res: Response = await testClient(app)["/v1/chat/completions"].$post(
    {
      json: payload,
      header: {
        "Content-Type": "application/json",
        "x-portkey-provider": "google",
        "Authorization": "Bearer " + Deno.env.get("GOOGLE_API_KEY"),
      },
    },
    {},
  );
  assertEquals(res.status, 200);
  if (res.ok) {
    const data = await res.json();
    console.log(data);
    const validationResult = openaiSchemas.CreateChatCompletionResponse
      .safeParse(data);
    assertEquals(validationResult.success, true);
  }
});

it("POST /v1/chat/completions IMAGE_URL", async () => {
  const payload = {
    model: "gemini-pro-vision",
    messages: [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "What’s in this image?",
          },
          {
            "type": "image_url",
            "image_url": {
              "url":
                "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg",
            },
          },
        ],
      },
    ],
    stream: true,
  };
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  const res: Response = await testClient(app)["/v1/chat/completions"].$post(
    {
      json: payload,
      header: {
        "Content-Type": "application/json",
        "x-portkey-provider": "google",
        "Authorization": "Bearer " + Deno.env.get("GOOGLE_API_KEY"),
      },
    },
    {},
  );
  assertEquals(res.status, 200);
  if (res.ok) {
    const data = await res.json();
    console.log(data);
    const validationResult = openaiSchemas.CreateChatCompletionResponse
      .safeParse(data);
    assertEquals(validationResult.success, true);
  }
});

it("POST /v1/embeddings", async () => {
  const payload = {
    input: "The food was delicious and the waiter...",
    model: "embedding-001",
    encoding_format: "float",
  };
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  const res: Response = await testClient(app)["/v1/embeddings"].$post(
    {
      json: payload,
      header: {
        "Content-Type": "application/json",
        "x-portkey-provider": "google",
        "Authorization": "Bearer " + Deno.env.get("GOOGLE_API_KEY"),
      },
    },
    {},
  );
  assertEquals(res.status, 200);
  if (res.ok) {
    const data = await res.json();
    console.log(data);
    const validationResult = openaiSchemas.CreateEmbeddingResponse.safeParse(
      data,
    );
    assertEquals(validationResult.success, true);
  }
});

it("POST /v1/audio/transcriptions", async () => {
  const response = await fetch(
    "https://raw.githubusercontent.com/ggerganov/whisper.cpp/master/samples/jfk.wav",
  );
  const arrayBuffer = await response.arrayBuffer();
  const formData = new FormData();
  formData.append("file", new Blob([arrayBuffer]), "jfk.wav");
  formData.append("model", "@cf/openai/whisper");
  formData.append("response_format", "json");
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  const res: Response = await testClient(app)["/v1/audio/transcriptions"].$post(
    {
      form: formData,
      header: {
        "x-portkey-provider": Providers.CLOUDFLARE,
        "X-Auth-Email": Deno.env.get("CLOUDFLARE_ACCOUNT_ID"),
        "Authorization": "Bearer " + Deno.env.get("CLOUDFLARE_API_TOKEN"),
      },
    },
    {},
  );
  assertEquals(res.status, 200);
  if (res.ok) {
    const data = await res.json();
    console.log(data);
    const validationResult = openaiSchemas.CreateTranscriptionResponseJson
      .safeParse(data);
    assertEquals(validationResult.success, true);
  }
});

it("POST /v1/images/edits", async () => {
  const response = await fetch(
    "https://github.com/langchain-ai/langchainjs/blob/main/examples/hotdog.jpg?raw=true",
  );
  const buffer = await response.arrayBuffer();
  const formData = new FormData();
  formData.append("image", new Blob([buffer]), "otter.png");
  formData.append("mask", new Blob([buffer]), "mask.png");
  formData.append("prompt", "A cute baby sea otter wearing a beret");
  formData.append("n", "2");
  formData.append("size", "1024x1024");
  formData.append("model", "@cf/bytedance/stable-diffusion-xl-lightning");
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  const res: Response = await testClient(app)["/v1/images/edits"].$post(
    {
      form: formData,
      header: {
        "x-portkey-provider": Providers.CLOUDFLARE,
        "X-Auth-Email": Deno.env.get("CLOUDFLARE_ACCOUNT_ID"),
        "Authorization": "Bearer " + Deno.env.get("CLOUDFLARE_API_TOKEN"),
      },
    },
    {},
  );
  assertEquals(res.status, 200);
  if (res.ok) {
    const data = await res.json();
    console.log(data);
  }
});
