import { z } from '../../deps.ts';

const TextEmbeddingsResult = z.object({
    data: z.array(z.array(z.number())).optional(),
    shape: z.array(z.number()).optional(),
}).passthrough();

const TranscriptionResult = z
    .object({
        text: z.string(),
        word_count: z.number().optional(),
        words: z
            .array(
                z
                    .object({
                        end: z.number(),
                        start: z.number(),
                        word: z.string(),
                    })
                    .partial()
                    .passthrough(),
            )
            .optional(),
    })
    .passthrough();

const Response = z.object({
    result: z.union([TextEmbeddingsResult, TranscriptionResult]),
    success: z.boolean().optional(),
}).passthrough();

export const schemas = {
    Response
}