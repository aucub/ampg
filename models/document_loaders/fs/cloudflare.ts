import {
  AsyncCaller,
  AsyncCallerParams,
  BaseDocumentLoader,
  BaseLangChainParams,
  Document,
  getEnvironmentVariable,
  z,
} from "../../../deps.ts";
import { schemas as cloudflareSchemas } from "../../../types/schemas/custom/cloudflare.ts";

export interface CloudflareWorkersAIAudioParams
  extends AsyncCallerParams, BaseLangChainParams {
  /** Model name to use */
  modelName?: string;

  cloudflareAccountId?: string;

  cloudflareApiToken?: string;

  baseUrl?: string;
}

export class CloudflareWorkersAIAudio extends BaseDocumentLoader {
  public async load(): Promise<Document[]> {
    let metadata: Record<string, any> = {
      source: "blob",
      blobType: this.blob.type,
    };
    return this.parse(this.blob, metadata);
  }

  caller: AsyncCaller;

  static lc_name() {
    return "CloudflareWorkersAIAudio";
  }

  lc_serializable = true;

  modelName = "@cf/openai/whisper";

  cloudflareAccountId?: string;

  cloudflareApiToken?: string;

  baseUrl: string;

  blob: Blob;

  constructor(blob: Blob, fields: CloudflareWorkersAIAudioParams) {
    super();
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
    this.blob = blob;
  }

  get lc_secrets(): { [key: string]: string } | undefined {
    return {
      cloudflareApiToken: "CLOUDFLARE_API_TOKEN",
    };
  }

  async _request(
    blob: Blob,
  ) {
    this.validateEnvironment();
    const url = `${this.baseUrl}/${this.modelName}`;
    const headers = {
      Authorization: `Bearer ${this.cloudflareApiToken}`,
      "Content-Type": blob.type,
    };
    return this.caller.call(async () => {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: blob,
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

      return responseData.result;
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

  protected async parse(
    blob: Blob,
    metadata: Record<string, any>,
  ): Promise<Document[]> {
    const transcriptionResponse = await this.caller.call(async () => {
      return await this._request(blob);
    });
    metadata["word_count"] = transcriptionResponse.word_count;
    metadata["words"] = transcriptionResponse.words;
    const document = new Document({
      pageContent: transcriptionResponse.text as string,
      metadata,
    });
    return [document];
  }
}
