#!/bin/bash

cd types
curl -o openai.yaml https://raw.githubusercontent.com/openai/openai-openapi/master/openapi.yaml
curl -o litellm.json https://raw.githubusercontent.com/BerriAI/litellm/main/litellm/proxy/openapi.json
curl -o cloudflare.json https://raw.githubusercontent.com/cloudflare/api-schemas/main/openapi.json
deno run -A npm:openapi-zod-client "openai.yaml" -o "openai.ts"
deno run -A npm:openapi-zod-client "litellm.json" -o "litellm.ts"
deno run -A npm:openapi-zod-client "cloudflare.json" -o "cloudflare.ts"
sed -i '1,2s|@zodios/core|../deps.ts|g;1,2s|zod|../deps.ts|g' openai.ts
sed -i '1,2s|@zodios/core|../deps.ts|g;1,2s|zod|../deps.ts|g' litellm.ts
sed -i '1,2s|@zodios/core|../deps.ts|g;1,2s|zod|../deps.ts|g' cloudflare.ts
rm openai.yaml
rm litellm.json
rm cloudflare.json
