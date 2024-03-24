import { IterableReadableStream } from "../deps";

export async function urlToDataURL(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Failed to download.");
    }
    const blob = await response.blob();
    return blobToDataURL(blob);
}

// Convert a blob to a data URL string
export function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Convert a blob to a base64 string
export async function blobToBase64(blob: Blob): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64String = btoa(
        new TextDecoder('utf-8').decode(uint8Array)
    );
    return base64String;
}

export function isIterableReadableStream(obj: any): obj is IterableReadableStream {
    return obj != null && "locked" in obj && "cancel" in obj && "getReader" in obj;
}