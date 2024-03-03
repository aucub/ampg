export interface BaseModelParams {
    /** Unique string identifier representing your end-user. */
    user?: string;
    /** Model name to use */
    modelName?: string;
    /**
     * API key to use when making requests.
     */
    apiKey?: null | string;
    /**
     * Override the default base URL for the API.
     */
    baseURL?: string;
    /** The AI provider to use for your calls. */
    provider?: null | string;
    cache?: boolean | false;
}



export interface ChatModelParams extends BaseModelParams {
    /** The randomness of the responses. */
    temperature?: number;
    /**
     * Maximum number of tokens to generate in the completion.
     */
    maxTokens?: number;
    /** Consider the n most likely tokens. */
    topK?: number;
    /** Total probability mass of tokens to consider at each step */
    topP?: number;
    /** Number of completions to generate for each prompt */
    n?: number;
    /** Whether to stream the results or not. */
    streaming?: boolean;
    /** List of stop words to use when generating */
    stop?: string[];
    /** If null, a random seed will be used. */
    seed?: null | number;
}


export interface EmbeddingsParams extends BaseModelParams {
    encoding_format?: string;
    /**
     * An optional title for the text.
     */
    title?: string;
    /**
     * The maximum number of documents to embed in a single request.
     */
    batchSize?: number;
    /**
     * Whether to strip new lines from the input text. Default to true
     */
    stripNewLines?: boolean;
}

