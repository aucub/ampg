import {
  AsyncCaller,
  AsyncCallerParams,
  getEnvironmentVariable,
  Tool,
  ToolParams,
} from "../../deps.ts";
import { blobToDataURL } from "../../helpers/util.ts";

/**
 * An interface for the CloudflareWorkersAI Text-to-Image API Wrapper.
 */
export interface CloudflareWorkersAIImageEditAPIWrapperParams
  extends AsyncCallerParams, ToolParams {
  /** Model name to use */
  modelName?: string;

  cloudflareAccountId?: string;

  cloudflareApiToken?: string;

  baseUrl: string;

  n?: number;

  size?: string;

  guidance?: number;

  num_steps?: number;

  strength?: number;

  image?: File;

  prompt?: string;

  mask?: File;
}

/**
 * A tool for generating images with CloudflareWorkersAI Text-to-Image API.
 */
export class CloudflareWorkersAIImageEditAPIWrapper extends Tool {
  async _call(): Promise<string> {
    const blob = await this._request();
    return blobToDataURL(blob);
  }
  caller: AsyncCaller;

  static lc_name() {
    return "CloudflareWorkersAIImageEditAPIWrapper";
  }

  name = "cloudflare_workers_ai_image_edit_api_wrapper";

  description =
    "A wrapper around CloudflareWorkersAI Text-to-Image API. Useful for when you need to generate images from a text description.";

  static readonly toolName = "cloudflare_workers_ai_image_edit_api_wrapper";

  modelName = "@cf/runwayml/stable-diffusion-v1-5-inpainting";

  n = 1;

  cloudflareAccountId?: string;

  cloudflareApiToken?: string;

  baseUrl: string;

  size?: string;

  guidance?: number;

  num_steps?: number;

  strength?: number;

  image?: File;

  prompt?: string;

  mask?: File;

  constructor(fields?: CloudflareWorkersAIImageEditAPIWrapperParams) {
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
    this.modelName = fields?.modelName ?? this.modelName;
    this.n = fields?.n ?? this.n;
    this.guidance = fields?.guidance;
    this.num_steps = fields?.num_steps;
    this.prompt = fields?.prompt;
    this.strength = fields?.strength;
    this.image = fields?.image;
    this.mask = fields?.mask;
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

  async _request() {
    this.validateEnvironment();
    const data = {
      guidance: this.guidance,
      num_steps: this.num_steps,
      prompt: this.prompt,
      strength: this.strength,
      image: this.image,
      mask: this.mask,
    };
    const url = `${this.baseUrl}/${this.modelName}`;
    const headers = {
      Authorization: `Bearer ${this.cloudflareApiToken}`,
      "Content-Type": "application/json",
    };
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
      return await response.blob();
    });
  }

  async run(): Promise<Blob> {
    return await this._request();
  }
}
