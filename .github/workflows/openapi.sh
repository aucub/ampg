#!/bin/bash

cd types/schemas
curl -o openai.yaml https://raw.githubusercontent.com/openai/openai-openapi/master/openapi.yaml
deno run -A npm:openapi-zod-client "openai.yaml" -o "openai.ts"
sed -i '1,2s|@zodios/core|../../deps.ts|g;1,2s|zod|../../deps.ts|g' openai.ts
rm openai.yaml
