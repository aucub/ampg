import { SecretMap } from "../config.ts";
import { configAsync } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";
import { app } from "../app.ts";
import { assertEquals } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { it } from "https://deno.land/std@0.219.1/testing/bdd.ts";
import { testClient } from "../deps.ts";

const secretMap: SecretMap = await configAsync();

it("POST /v1/chat/completions", async () => {
  const payload = {
    model: "gpt-3.5-turbo",
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
  const res: Response = await testClient(app)["/v1/chat/completions"].$post(
    {
      json: payload,
      header: {
        "Content-Type": "application/json",
        "x-portkey-provider": "openai",
        "Authorization": "Bearer " + secretMap.OPENAI_API_KEY,
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
