/// <reference types="vite/client" />

export type Provider = "auto" | "gemini" | "groq" | "ollama";

export interface LLMConfig {
  provider: Provider;
  geminiModel?: string;
  groqModel?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
  language?: string;
}

export interface ProviderStatus {
  provider: Provider;
  configured: boolean;
  supportsMedia: boolean;
  model?: string;
}

export interface ProviderCheck {
  provider: Provider;
  configured: boolean;
  ok: boolean;
  model?: string;
  message: string;
}

export interface SourceTrustResult {
  domain: string;
  score: number;
  rating: string;
  summary: string;
  signals: Array<{ label: string; value: string; status: "positive" | "neutral" | "negative" }>;
  reasons: string[];
}

export interface EvidenceTimelineItem {
  id: string;
  date: string;
  title: string;
  source: string;
  url?: string;
  type: "origin" | "coverage" | "verification" | "context";
  note: string;
}

export interface ClaimComparisonResult {
  verdict: string;
  confidence: number;
  summary: string;
  shared_claims: string[];
  contradictions: string[];
  missing_context: string[];
  recommended_actions: string[];
  provider_used?: string;
  model_used?: string;
}

const API_URL = "/api";

async function parseApiResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status} ${res.statusText}`);
  }
  return data;
}

export async function getProviderStatuses(): Promise<ProviderStatus[]> {
  const data = await parseApiResponse(await fetch(`${API_URL}/providers`));
  return data.providers || [];
}

export async function analyzeText(text: string, sourceUrl: string | null, config: LLMConfig) {
  return parseApiResponse(
    await fetch(`${API_URL}/analyze-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, sourceUrl, config }),
    }),
  );
}

export async function getSourceTrust(sourceUrl: string | null): Promise<SourceTrustResult> {
  return parseApiResponse(
    await fetch(`${API_URL}/source-trust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceUrl }),
    }),
  );
}

export async function getEvidenceTimeline(
  query: string,
  sourceUrl: string | null,
): Promise<{ source: string; items: EvidenceTimelineItem[] }> {
  return parseApiResponse(
    await fetch(`${API_URL}/evidence-timeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, sourceUrl }),
    }),
  );
}

export async function compareClaims(
  left: string,
  right: string,
  config: LLMConfig,
): Promise<ClaimComparisonResult> {
  return parseApiResponse(
    await fetch(`${API_URL}/compare-claims`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ left, right, config }),
    }),
  );
}

export async function testConnection(config: LLMConfig): Promise<ProviderCheck> {
  return parseApiResponse(
    await fetch(`${API_URL}/providers/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    }),
  );
}

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result.split(",")[1]);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export async function analyzeMedia(file: File, mediaType: "video" | "audio" | "image", config: LLMConfig) {
  const base64Data = await fileToBase64(file);
  return parseApiResponse(
    await fetch(`${API_URL}/analyze-media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base64Data,
        fileName: file.name,
        mimeType: file.type,
        mediaType,
        config,
      }),
    }),
  );
}
