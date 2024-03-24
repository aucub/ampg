import { app } from "../app.ts";
import { assertEquals, decodeBase64, it, testClient } from "../deps.ts";
import { schemas as openaiSchemas } from "../types/schemas/openai.ts";
import { Providers } from "../config.ts";

it("POST /v1/chat/completions", async () => {
  const payload = {
    model: "gemini-pro",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant.",
      },
      {
        role: "user",
        content: "Hello!",
      },
    ],
  };
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not set in the environment variables.");
  }
  const res = await testClient(app)["/v1/chat/completions"].$post({
    json: payload,
    headers: {
      "Content-Type": "application/json",
      "x-portkey-provider": Providers.OPENAI,
      "Authorization": `Bearer ${openaiApiKey}`,
    },
  });

  assertEquals(res.status, 200);
  if (res.ok) {
    const data = await res.json();
    console.log(data);
    const validationResult = openaiSchemas.CreateChatCompletionResponse.safeParse(data);
    assertEquals(validationResult.success, true);
    if (!validationResult.success) {
      console.error(validationResult.error);
    }
  }
});

it("POST /v1/chat/completions Stream", async () => {
  const payload = {
    model: "gemini-pro",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant.",
      },
      {
        role: "user",
        content: "Hello!",
      },
    ],
    stream: true,
  };

  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not set in the environment variables.");
  }
  const res = await testClient(app)["/v1/chat/completions"].$post({
    json: payload,
    headers: {
      "Content-Type": "application/json",
      "x-portkey-provider": Providers.OPENAI,
      "Authorization": `Bearer ${openaiApiKey}`,
    },
  });

  assertEquals(res.status, 200);
  if (res.ok && res.body) {
    const reader = res.body.getReader();
    let result = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        result += new TextDecoder("utf-8").decode(value, { stream: true });
        if (result.startsWith("data:")) {
          const jsonEndIndex = result.indexOf("\n\n");
          if (jsonEndIndex !== -1) {
            const jsonString = result.slice(5, jsonEndIndex);
            result = result.slice(jsonEndIndex + 2);
            const data = JSON.parse(jsonString);
            console.log(data);
          }
        }
      }
      assertEquals(result.trimEnd(), "[DONE]");
    } catch (error) {
      console.error("Error reading the stream:", error);
    } finally {
      reader.releaseLock();
    }
  } else {
    console.error("Response was not ok", res);
  }
});

it("POST /v1/chat/completions IMAGE_URL", async () => {
  const payload = {
    model: "gemini-pro-vision",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "What’s in this image?",
          },
          {
            type: "image_url",
            url:
              "https://github.com/langchain-ai/langchainjs/blob/main/examples/hotdog.jpg?raw=true",
          },
        ],
      },
    ],
  };

  const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
  if (!googleApiKey) {
    throw new Error("GOOGLE_API_KEY is not set in the environment variables.");
  }
  const res = await testClient(app)["/v1/chat/completions"].$post({
    json: payload,
    headers: {
      "Content-Type": "application/json",
      "x-portkey-provider": Providers.GOOGLE,
      "Authorization": `Bearer ${googleApiKey}`,
    },
  });

  assertEquals(res.status, 200);
  if (res.ok) {
    const data = await res.json();
    console.log(data);
    const validationResult = openaiSchemas.CreateChatCompletionResponse.safeParse(data);
    assertEquals(validationResult.success, true);
    if (!validationResult.success) {
      console.error(validationResult.error);
    }
  } else {
    console.error("Response was not ok", res);
  }
});

it("POST /v1/embeddings", async () => {
  const payload = {
    input: "The food was delicious and the waiter...",
    model: "embedding-001",
    encoding_format: "float",
  };
  const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
  if (!googleApiKey) {
    throw new Error("GOOGLE_API_KEY is not set in the environment variables.");
  }
  const res = await testClient(app)["/v1/embeddings"].$post({
    json: payload,
    headers: {
      "Content-Type": "application/json",
      "x-portkey-provider": Providers.GOOGLE,
      "Authorization": `Bearer ${googleApiKey}`,
    },
  });
  assertEquals(res.status, 200);
  if (res.ok) {
    const data = await res.json();
    console.log(data);
    const validationResult = openaiSchemas.CreateEmbeddingResponse.safeParse(data);
    assertEquals(validationResult.success, true);
    if (!validationResult.success) {
      console.error(validationResult.error);
    }
  } else {
    console.error("Response was not ok", res);
  }
});

it.skip("POST /v1/audio/transcriptions", async () => {
  try {
    const audioFileResponse = await fetch(
      "https://raw.githubusercontent.com/ggerganov/whisper.cpp/master/samples/jfk.wav"
    );

    if (!audioFileResponse.ok) {
      throw new Error(`Failed to download audio file: ${audioFileResponse.status}`);
    }

    const arrayBuffer = await audioFileResponse.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "audio/wav" });
    const file = new File([blob], "jfk.wav");

    // Send the transcription request
    const transcriptionResponse: Response = await testClient(app)["/v1/audio/transcriptions"].$post(
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
      }
    );
    assertEquals(transcriptionResponse.status, 200);
    if (transcriptionResponse.ok) {
      const data = await transcriptionResponse.json();
      console.log(data);
      const validationResult = openaiSchemas.CreateTranscriptionResponseJson.safeParse(data);
      assertEquals(validationResult.success, true);
    } else {
      throw new Error(`Transcription request failed: ${transcriptionResponse.status}`);
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
});

it("POST /v1/images/edits", async () => {
  try {
    const imageFileResponse = await fetch(
      "https://pub-1fb693cb11cc46b2b2f656f51e015a2c.r2.dev/dog.png"
    );
    if (!imageFileResponse.ok) {
      throw new Error(`Failed to download image file: ${imageFileResponse.status}`);
    }
    const arrayBuffer = await imageFileResponse.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "image/png" });
    const imageFile = new File([blob], "otter.png");
    const maskFile = new File([blob], "mask.png");
    const editResponse: Response = await testClient(app)["/v1/images/edits"].$post(
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
      }
    );
    assertEquals(editResponse.status, 200);
    if (editResponse.ok) {
      const data = await editResponse.json();
      console.log(data);
      for (let index = 0; index < data.data.length; index++) {
        const imageDict = data.data[index];
        const imageData = decodeBase64(imageDict.b64_json);
        const imageFilePath = `dog_edited_${index}.png`;
        await Deno.writeFile(imageFilePath, imageData);
      }
    } else {
      throw new Error(`Image edit request failed: ${editResponse.status}`);
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
});