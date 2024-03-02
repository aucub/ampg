export interface AIInput {
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
    /** Unique string identifier representing your end-user. */
    user?: string;
    /** Whether to stream the results or not. */
    streaming?: boolean;
    /** Model name to use */
    model?: string;
    /** List of stop words to use when generating */
    stop?: string[];
    /**
     * API key to use when making requests.
     */
    apiKey?: null | string;
    /**
     * Override the default base URL for the API.
     */
    baseUrl?: string;
    /** If null, a random seed will be used. */
    seed?: null | number;
    /** The AI provider to use for your calls. */
    provider?: null | string;
}

