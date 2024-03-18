import { app } from "../app.ts";
import { assertEquals, decodeBase64, it, testClient } from "../deps.ts";
import { schemas as openaiSchemas } from "../types/openai.ts";
import { Providers } from "../config.ts";

it.skip("POST /v1/chat/completions", async () => {
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
        "x-portkey-provider": Providers.OPENAI,
        "Authorization": "Bearer " + Deno.env.get("OPENAI_API_KEY"),
      },
    },
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

it.skip("POST /v1/chat/completions Stream", async () => {
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
    stream: true,
  };
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  const res: Response = await testClient(app)["/v1/chat/completions"].$post(
    {
      json: payload,
      header: {
        "Content-Type": "application/json",
        "x-portkey-provider": Providers.OPENAI,
        "Authorization": "Bearer " + Deno.env.get("OPENAI_API_KEY"),
      },
    },
  );
  assertEquals(res.status, 200);
  if (res.ok) {
    if (res.body) {
      const reader = new ReadableStreamDefaultReader(res.body);
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        result = new TextDecoder("utf-8").decode(value);
        if (
          result.startsWith("data:") && !result.trimEnd().endsWith("[DONE]")
        ) {
          const data = JSON.parse(result.slice(5));
          console.log(data);
        } else if (result) {
          console.log(result);
          assertEquals(result.trimEnd().endsWith("[DONE]"), true);
        } else {
          console.log(result);
        }
      }
    }
  }
});

it.skip("POST /v1/chat/completions IMAGE_URL", async () => {
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
                "https://github.com/langchain-ai/langchainjs/blob/main/examples/hotdog.jpg?raw=true",
            },
          },
        ],
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
        "x-portkey-provider": Providers.GOOGLE,
        "Authorization": "Bearer " + Deno.env.get("GOOGLE_API_KEY"),
      },
    },
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

it.skip("POST /v1/embeddings", async () => {
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
        "x-portkey-provider": Providers.GOOGLE,
        "Authorization": "Bearer " + Deno.env.get("GOOGLE_API_KEY"),
      },
    },
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

it.skip("POST /v1/audio/transcriptions", async () => {
  const response = await fetch(
    "https://raw.githubusercontent.com/ggerganov/whisper.cpp/master/samples/jfk.wav",
  );
  assertEquals(response.status, 200);
  const arrayBuffer = await response.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: "application/octet-stream" });
  const file = new File([blob], "jfk.wav");
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  const res: Response = await testClient(app)["/v1/audio/transcriptions"].$post(
    {
      form: {
        "file": file,
        "model": "@cf/openai/whisper",
        "response_format": "json",
      },
      header: {
        "x-portkey-provider": Providers.CLOUDFLARE,
        "X-Auth-Email": Deno.env.get("CLOUDFLARE_ACCOUNT_ID"),
        "Authorization": "Bearer " + Deno.env.get("CLOUDFLARE_API_TOKEN"),
      },
    },
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

it.skip("POST /v1/images/edits", async () => {
  const response = await fetch(
    "https://pub-1fb693cb11cc46b2b2f656f51e015a2c.r2.dev/dog.png",
  );
  assertEquals(response.status, 200);
  const arrayBuffer = await response.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: "image/png" });
  const imageFile = new File([blob], "otter.png");
  const maskFile = new File([blob], "mask.png");
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  const res: Response = await testClient(app)["/v1/images/edits"].$post(
    {
      form: {
        "image": imageFile,
        "mask": maskFile,
        "prompt": "A cute baby sea otter wearing a beret",
        "n": 1 as number,
        "size": "1024x1024",
        "model": "@cf/runwayml/stable-diffusion-v1-5-inpainting",
      },
      header: {
        "x-portkey-provider": Providers.CLOUDFLARE,
        "X-Auth-Email": Deno.env.get("CLOUDFLARE_ACCOUNT_ID"),
        "Authorization": "Bearer " + Deno.env.get("CLOUDFLARE_API_TOKEN"),
      },
    },
  );
  assertEquals(res.status, 200);
  if (res.ok) {
    const data = await res.json();
    console.log(data);
    for (let index = 0; index < data.data.length; index++) {
      const imageDict = data.data[index];
      const imageData = decodeBase64(imageDict.b64_json);
      const imageFilePath = `dog.png`;
      await Deno.writeFile(imageFilePath, imageData);
    }
  }
});
