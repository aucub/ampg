import {
  chunkArray,
  Embeddings,
  EmbeddingsParams,
  getEnvironmentVariable,
  z,
} from "../../deps.ts";
import { schemas as cloudflareSchemas } from "../../types/schemas/custom/cloudflare.ts";

export interface CloudflareWorkersAIEmbeddingsParams extends EmbeddingsParams {
  /** Model name to use */
  modelName?: string;

  cloudflareAccountId?: string;

  cloudflareApiToken?: string;

  baseUrl: string;

  /**
   * The maximum number of documents to embed in a single request.
   */
  batchSize?: number;

  /**
   * Whether to strip new lines from the input text.
   */
  stripNewLines?: boolean;
}

export class CloudflareWorkersAIEmbeddings extends Embeddings {
  static lc_name() {
    return "CloudflareWorkersAIEmbeddings";
  }

  lc_serializable = true;

  modelName = "@cf/baai/bge-base-en-v1.5";

  cloudflareAccountId?: string;

  cloudflareApiToken?: string;

  baseUrl: string;

  batchSize = 50;

  stripNewLines = true;

  constructor(fields: CloudflareWorkersAIEmbeddingsParams) {
    super(fields);
    this.cloudflareAccountId = fields?.cloudflareAccountId ??
      getEnvironmentVariable("CLOUDFLARE_ACCOUNT_ID");
    this.cloudflareApiToken = fields?.cloudflareApiToken ??
      getEnvironmentVariable("CLOUDFLARE_API_TOKEN");
    this.baseUrl = fields?.baseUrl ??
      `https://api.cloudflare.com/client/v4/accounts/${this.cloudflareAccountId}/ai/run`;
    if (this.baseUrl.endsWith("/")) {
      this.baseUrl = this.baseUrl.slice(0, -1);
    }
    this.modelName = fields.modelName ?? this.modelName;
    this.stripNewLines = fields.stripNewLines ?? this.stripNewLines;
  }

  get lc_secrets(): { [key: string]: string } | undefined {
    return {
      cloudflareApiToken: "CLOUDFLARE_API_TOKEN",
    };
  }

  async _request(
    texts: string[],
  ) {
    this.validateEnvironment();
    const url = `${this.baseUrl}/${this.modelName}`;
    const headers = {
      Authorization: `Bearer ${this.cloudflareApiToken}`,
      "Content-Type": "application/json",
    };
    const data = { text: texts };
    return this.caller.call(async () => {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = new Error(
          `Cloudflare call failed with status code ${response.status}`,
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any).response = response;
        throw error;
      }
      const responseData: z.infer<typeof cloudflareSchemas.Response> =
        await response.json();

      return responseData.result.data;
    });
  }

  /**
   * Method to validate the environment.
   */
  validateEnvironment() {
    if (!this.cloudflareAccountId) {
      throw new Error(
        `No Cloudflare account ID found. Please provide it when instantiating the CloudflareWorkersAI class, or set it as "CLOUDFLARE_ACCOUNT_ID" in your environment variables.`,
      );
    }
    if (!this.cloudflareApiToken) {
      throw new Error(
        `No Cloudflare API key found. Please provide it when instantiating the CloudflareWorkersAI class, or set it as "CLOUDFLARE_API_KEY" in your environment variables.`,
      );
    }
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const batches = chunkArray(
      this.stripNewLines ? texts.map((t) => t.replace(/\n/g, " ")) : texts,
      this.batchSize,
    );

    const batchRequests = batches.map((batch) => this.runEmbedding(batch));
    const batchResponses = await Promise.all(batchRequests);
    const embeddings: number[][] = [];

    for (let i = 0; i < batchResponses.length; i += 1) {
      const batchResponse = batchResponses[i];
      // @ts-ignore
      for (let j = 0; j < batchResponse.length; j += 1) {
        embeddings.push(batchResponse[j]);
      }
    }

    return embeddings;
  }

  async embedQuery(text: string): Promise<number[]> {
    const data = await this.runEmbedding([
      this.stripNewLines ? text.replace(/\n/g, " ") : text,
    ]);
    return data[0];
  }

  private async runEmbedding(texts: string[]) {
    return this.caller.call(async () => {
      return await this._request(texts);
    });
  }
}
