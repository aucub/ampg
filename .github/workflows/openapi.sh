#!/bin/bash

cd types/schemas
curl -o openai.yaml https://raw.githubusercontent.com/openai/openai-openapi/master/openapi.yaml
curl -o cloudflare.yaml https://raw.githubusercontent.com/cloudflare/api-schemas/main/openapi.yaml
python ../../.github/workflows/split-openapi.py
mv cloudflare-filtered.yaml cloudflare.yaml
deno run -A npm:openapi-zod-client "openai.yaml" -o "openai.ts"
deno run -A npm:openapi-zod-client "cloudflare.yaml" -o "cloudflare.ts"
sed -i '1,2s|@zodios/core|../../deps.ts|g;1,2s|zod|../../deps.ts|g' openai.ts
sed -i '1,2s|@zodios/core|../../deps.ts|g;1,2s|zod|../../deps.ts|g' cloudflare.ts
rm openai.yaml
rm cloudflare.yaml
