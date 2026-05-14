import "./loadEnv";
import { GoogleGenAI, Type } from "@google/genai";

export type Provider = "auto" | "gemini" | "groq" | "ollama";
type ConcreteProvider = Exclude<Provider, "auto">;
export type MediaType = "video" | "audio" | "image";

export interface LLMConfig {
  provider: Provider;
  geminiModel?: string;
  groqModel?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
  language?: string;
}

export interface ProviderCheck {
  provider: Provider;
  configured: boolean;
  ok: boolean;
  model?: string;
  message: string;
}

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const DEFAULT_OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1";

const TEXT_SYSTEM_PROMPT = `You are a careful misinformation analyst.
Analyze the supplied article, claim, headline, or scraped page text.

Return a cautious verdict. Do not claim certainty when there is not enough evidence.
Prefer MISLEADING over FAKE when the text mixes accurate facts with distortion, missing context, or manipulative framing.

Respond ONLY with valid JSON matching this shape:
{
  "label": "REAL" | "FAKE" | "MISLEADING",
  "confidence": number,
  "reasoning": "2-4 sentence explanation focused on evidence quality, internal consistency, source context, and manipulation signals.",
  "breakdown": {
    "tone": "short tone assessment",
    "logical_fallacies": ["fallacy or tactic names"],
    "fact_check_summary": "one concise fact-check summary",
    "source_reliability": "short reliability note"
  },
  "claims": [
    {
      "claim": "specific claim extracted from the input",
      "verdict": "SUPPORTED" | "QUESTIONABLE" | "UNSUPPORTED",
      "evidence_note": "brief note explaining why"
    }
  ],
  "recommended_actions": ["practical next verification step"],
  "top_keywords": ["up to 6 entities or keywords"]
}`;

const COMPARE_SYSTEM_PROMPT = `You compare two claims, article excerpts, or URLs for misinformation analysis.
Return ONLY valid JSON matching:
{
  "verdict": "CONSISTENT" | "CONTRADICTORY" | "PARTIAL_OVERLAP" | "INSUFFICIENT_CONTEXT",
  "confidence": number,
  "summary": "2-4 sentence comparison summary",
  "shared_claims": ["claims both inputs appear to share"],
  "contradictions": ["specific contradictions or mismatches"],
  "missing_context": ["important missing context"],
  "recommended_actions": ["next verification step"]
}`;

function getLanguageInstruction(config: LLMConfig) {
  const language = config.language || "English";
  return `Write all user-facing explanatory text in ${language}. Keep JSON keys and enum values exactly as requested.`;
}

function extractJSON(text: string) {
  if (!text) throw new Error("Received empty response from AI model.");

  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1]);
      } catch {}
    }

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {}
    }
  }

  throw new Error("The AI provider did not return valid JSON. Please try again.");
}

function normaliseConfidence(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  if (parsed > 1) return Math.min(1, parsed / 100);
  return Math.max(0, Math.min(1, parsed));
}

function normaliseResult(result: any) {
  const label = String(result?.label || "MISLEADING").toUpperCase();
  return {
    ...result,
    label,
    confidence: normaliseConfidence(result?.confidence),
    breakdown: {
      tone: result?.breakdown?.tone || "Unknown",
      logical_fallacies: Array.isArray(result?.breakdown?.logical_fallacies)
        ? result.breakdown.logical_fallacies
        : [],
      fact_check_summary: result?.breakdown?.fact_check_summary || "No summary returned.",
      source_reliability: result?.breakdown?.source_reliability || "No source reliability note returned.",
    },
    claims: Array.isArray(result?.claims) ? result.claims.slice(0, 6) : [],
    recommended_actions: Array.isArray(result?.recommended_actions)
      ? result.recommended_actions.slice(0, 5)
      : [],
    top_keywords: Array.isArray(result?.top_keywords) ? result.top_keywords.slice(0, 6) : [],
  };
}

function getGeminiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ""
  );
}

function getGroqKey() {
  return process.env.GROQ_API_KEY || process.env.GROQ_KEY || "";
}

function isLimitError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  return /429|quota|rate.?limit|resource exhausted|too many requests|limit exceeded|insufficient_quota|usage limit/i.test(message);
}

function getLimitMessage() {
  return "Today your Gemini and Groq limits are hit. Please try again tomorrow.";
}

function getGeminiSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      label: { type: Type.STRING, enum: ["REAL", "FAKE", "MISLEADING"] },
      confidence: { type: Type.NUMBER },
      reasoning: { type: Type.STRING },
      breakdown: {
        type: Type.OBJECT,
        properties: {
          tone: { type: Type.STRING },
          logical_fallacies: { type: Type.ARRAY, items: { type: Type.STRING } },
          fact_check_summary: { type: Type.STRING },
          source_reliability: { type: Type.STRING },
        },
        required: ["tone", "logical_fallacies", "fact_check_summary", "source_reliability"],
      },
      claims: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            claim: { type: Type.STRING },
            verdict: { type: Type.STRING, enum: ["SUPPORTED", "QUESTIONABLE", "UNSUPPORTED"] },
            evidence_note: { type: Type.STRING },
          },
          required: ["claim", "verdict", "evidence_note"],
        },
      },
      recommended_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
      top_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["label", "confidence", "reasoning", "breakdown", "claims", "recommended_actions", "top_keywords"],
  };
}

function getCompareSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      verdict: {
        type: Type.STRING,
        enum: ["CONSISTENT", "CONTRADICTORY", "PARTIAL_OVERLAP", "INSUFFICIENT_CONTEXT"],
      },
      confidence: { type: Type.NUMBER },
      summary: { type: Type.STRING },
      shared_claims: { type: Type.ARRAY, items: { type: Type.STRING } },
      contradictions: { type: Type.ARRAY, items: { type: Type.STRING } },
      missing_context: { type: Type.ARRAY, items: { type: Type.STRING } },
      recommended_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["verdict", "confidence", "summary", "shared_claims", "contradictions", "missing_context", "recommended_actions"],
  };
}

function normaliseComparison(result: any) {
  const verdict = String(result?.verdict || "INSUFFICIENT_CONTEXT").toUpperCase();
  return {
    verdict,
    confidence: normaliseConfidence(result?.confidence),
    summary: result?.summary || "The comparison did not return a summary.",
    shared_claims: Array.isArray(result?.shared_claims) ? result.shared_claims.slice(0, 6) : [],
    contradictions: Array.isArray(result?.contradictions) ? result.contradictions.slice(0, 6) : [],
    missing_context: Array.isArray(result?.missing_context) ? result.missing_context.slice(0, 6) : [],
    recommended_actions: Array.isArray(result?.recommended_actions) ? result.recommended_actions.slice(0, 5) : [],
  };
}

function getMediaPrompt(mediaType: MediaType) {
  if (mediaType === "video") {
    return `Analyze this video for deepfake or AI-generated manipulation signals. Check facial consistency, blinking, lighting, compression artifacts, temporal jitter, and edge/color issues.
Return JSON with label REAL, FAKE, or MISLEADING, confidence, reasoning, breakdown, claims, recommended_actions, and top_keywords.`;
  }

  if (mediaType === "audio") {
    return `Analyze this audio for AI voice clone or synthetic TTS signals. Check prosody, pitch variation, breathing, spectral consistency, vocoder artifacts, and unnatural pauses.
Return JSON with label REAL, FAKE, or MISLEADING, confidence, reasoning, breakdown, claims, recommended_actions, and top_keywords.`;
  }

  return `Analyze this image for AI generation or digital manipulation signals. Check anatomy, faces, hands, text, shadows, repeated textures, metadata context, and background consistency.
Return JSON with label REAL, FAKE, or MISLEADING, confidence, reasoning, breakdown, claims, recommended_actions, and top_keywords.`;
}

function getOllamaUrl(config?: LLMConfig) {
  const rawUrl = (config?.ollamaUrl || DEFAULT_OLLAMA_URL).replace(/\/$/, "");
  const parsed = new URL(rawUrl);
  const allowedHosts = new Set(["localhost", "127.0.0.1", "::1"]);

  if (process.env.ALLOW_REMOTE_OLLAMA !== "true" && !allowedHosts.has(parsed.hostname)) {
    throw new Error("Remote Ollama URLs are disabled by default. Set ALLOW_REMOTE_OLLAMA=true to allow them.");
  }

  return rawUrl;
}

export function getProviderSummary() {
  const geminiConfigured = Boolean(getGeminiKey());
  const groqConfigured = Boolean(getGroqKey());

  return [
    {
      provider: "auto" as const,
      configured: geminiConfigured || groqConfigured,
      model: `${DEFAULT_GEMINI_MODEL} -> ${DEFAULT_GROQ_MODEL}`,
      supportsMedia: true,
    },
    {
      provider: "gemini" as const,
      configured: geminiConfigured,
      model: DEFAULT_GEMINI_MODEL,
      supportsMedia: true,
    },
    {
      provider: "groq" as const,
      configured: groqConfigured,
      model: DEFAULT_GROQ_MODEL,
      supportsMedia: false,
    },
    {
      provider: "ollama" as const,
      configured: true,
      model: DEFAULT_OLLAMA_MODEL,
      supportsMedia: false,
    },
  ];
}

async function analyzeTextWithGemini(prompt: string, config: LLMConfig) {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error("Gemini API key is missing on the server.");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: config.geminiModel || DEFAULT_GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: getGeminiSchema(),
    },
  });

  return {
    ...normaliseResult(extractJSON(response.text || "")),
    provider_used: "gemini",
    model_used: config.geminiModel || DEFAULT_GEMINI_MODEL,
  };
}

async function analyzeTextWithGroq(text: string, sourceUrl: string | null, config: LLMConfig) {
  const apiKey = getGroqKey();
  if (!apiKey) throw new Error("Groq API key is missing on the server.");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.groqModel || DEFAULT_GROQ_MODEL,
      messages: [
        { role: "system", content: `${TEXT_SYSTEM_PROMPT}\n\n${getLanguageInstruction(config)}` },
        { role: "user", content: `${sourceUrl ? `Source URL: ${sourceUrl}\n` : ""}Input:\n${text}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return {
    ...normaliseResult(extractJSON(data.choices?.[0]?.message?.content || "")),
    provider_used: "groq",
    model_used: config.groqModel || DEFAULT_GROQ_MODEL,
  };
}

async function analyzeTextWithOllama(text: string, sourceUrl: string | null, config: LLMConfig) {
  const url = getOllamaUrl(config);
  const res = await fetch(`${url}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.ollamaModel || DEFAULT_OLLAMA_MODEL,
      messages: [
        { role: "system", content: `${TEXT_SYSTEM_PROMPT}\n\n${getLanguageInstruction(config)}` },
        { role: "user", content: `${sourceUrl ? `Source URL: ${sourceUrl}\n` : ""}Input:\n${text}` },
      ],
      stream: false,
      format: "json",
      options: { temperature: 0.1 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Ollama error (${res.status}): ${errText || res.statusText}`);
  }

  const data = await res.json();
  return {
    ...normaliseResult(extractJSON(data.message?.content || "")),
    provider_used: "ollama",
    model_used: config.ollamaModel || DEFAULT_OLLAMA_MODEL,
  };
}

function getTextProviderOrder(provider: Provider): ConcreteProvider[] {
  if (provider === "groq") return ["groq", "gemini"];
  if (provider === "ollama") return ["ollama"];
  return ["gemini", "groq"];
}

export async function analyzeTextWithProvider(text: string, sourceUrl: string | null, config: LLMConfig) {
  const provider = config.provider || "auto";
  const prompt = `${TEXT_SYSTEM_PROMPT}\n\n${getLanguageInstruction(config)}\n\n${sourceUrl ? `Source URL: ${sourceUrl}\n` : ""}Input:\n${text}`;
  const errors: Error[] = [];

  for (const currentProvider of getTextProviderOrder(provider)) {
    try {
      if (currentProvider === "gemini") return await analyzeTextWithGemini(prompt, config);
      if (currentProvider === "groq") return await analyzeTextWithGroq(text, sourceUrl, config);
      return await analyzeTextWithOllama(text, sourceUrl, config);
    } catch (error: any) {
      errors.push(error);
      const shouldFallback =
        currentProvider === "gemini" || currentProvider === "groq"
          ? isLimitError(error) || /api key is missing/i.test(error.message || "")
          : false;
      if (!shouldFallback) throw error;
    }
  }

  if (errors.some(isLimitError)) throw new Error(getLimitMessage());
  throw errors[errors.length - 1] || new Error("No provider is configured.");
}

async function compareWithGemini(left: string, right: string, config: LLMConfig) {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error("Gemini API key is missing on the server.");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: config.geminiModel || DEFAULT_GEMINI_MODEL,
    contents: `${COMPARE_SYSTEM_PROMPT}\n\n${getLanguageInstruction(config)}\n\nInput A:\n${left}\n\nInput B:\n${right}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: getCompareSchema(),
    },
  });

  return {
    ...normaliseComparison(extractJSON(response.text || "")),
    provider_used: "gemini",
    model_used: config.geminiModel || DEFAULT_GEMINI_MODEL,
  };
}

async function compareWithGroq(left: string, right: string, config: LLMConfig) {
  const apiKey = getGroqKey();
  if (!apiKey) throw new Error("Groq API key is missing on the server.");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.groqModel || DEFAULT_GROQ_MODEL,
      messages: [
        { role: "system", content: `${COMPARE_SYSTEM_PROMPT}\n\n${getLanguageInstruction(config)}` },
        { role: "user", content: `Input A:\n${left}\n\nInput B:\n${right}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return {
    ...normaliseComparison(extractJSON(data.choices?.[0]?.message?.content || "")),
    provider_used: "groq",
    model_used: config.groqModel || DEFAULT_GROQ_MODEL,
  };
}

export async function compareClaimsWithProvider(left: string, right: string, config: LLMConfig) {
  const provider = config.provider || "auto";
  const errors: Error[] = [];

  for (const currentProvider of getTextProviderOrder(provider)) {
    if (currentProvider === "ollama") continue;
    try {
      if (currentProvider === "gemini") return await compareWithGemini(left, right, config);
      return await compareWithGroq(left, right, config);
    } catch (error: any) {
      errors.push(error);
      const shouldFallback = isLimitError(error) || /api key is missing/i.test(error.message || "");
      if (!shouldFallback) throw error;
    }
  }

  if (errors.some(isLimitError)) throw new Error(getLimitMessage());
  throw errors[errors.length - 1] || new Error("No comparison provider is configured.");
}

export async function analyzeMediaWithProvider(
  base64Data: string,
  mimeType: string,
  mediaType: MediaType,
  config: LLMConfig,
) {
  const mediaProvider = config.provider || "auto";
  if (mediaProvider !== "gemini" && mediaProvider !== "auto") {
    throw new Error("Media analysis is currently available through Gemini only.");
  }

  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error("Gemini API key is missing on the server.");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: config.geminiModel || DEFAULT_GEMINI_MODEL,
    contents: [
      {
        parts: [
          { text: `${TEXT_SYSTEM_PROMPT}\n\n${getLanguageInstruction(config)}\n\n${getMediaPrompt(mediaType)}` },
          { inlineData: { data: base64Data, mimeType } },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: getGeminiSchema(),
    },
  });

  return {
    ...normaliseResult(extractJSON(response.text || "")),
    provider_used: "gemini",
    model_used: config.geminiModel || DEFAULT_GEMINI_MODEL,
  };
}

export async function testProviderConnection(config: LLMConfig): Promise<ProviderCheck> {
  const provider = config.provider || "auto";

  try {
    if (provider === "auto") {
      const geminiConfigured = Boolean(getGeminiKey());
      const groqConfigured = Boolean(getGroqKey());
      return {
        provider,
        configured: geminiConfigured || groqConfigured,
        ok: geminiConfigured || groqConfigured,
        model: `${geminiConfigured ? config.geminiModel || DEFAULT_GEMINI_MODEL : "Gemini not configured"} -> ${groqConfigured ? config.groqModel || DEFAULT_GROQ_MODEL : "Groq not configured"}`,
        message: geminiConfigured || groqConfigured
          ? "Auto fallback is ready. Text analysis will switch providers if a quota/rate limit is hit."
          : "Gemini or Groq API key is missing on the server.",
      };
    }

    if (provider === "gemini") {
      const model = config.geminiModel || DEFAULT_GEMINI_MODEL;
      const apiKey = getGeminiKey();
      if (!apiKey) {
        return { provider, configured: false, ok: false, model, message: "Gemini API key is missing on the server." };
      }

      const ai = new GoogleGenAI({ apiKey });
      await ai.models.generateContent({ model, contents: "Reply with the word ok." });
      return { provider, configured: true, ok: true, model, message: "Gemini connection succeeded." };
    }

    if (provider === "groq") {
      const model = config.groqModel || DEFAULT_GROQ_MODEL;
      const apiKey = getGroqKey();
      if (!apiKey) {
        return { provider, configured: false, ok: false, model, message: "Groq API key is missing on the server." };
      }

      const res = await fetch(`https://api.groq.com/openai/v1/models/${model}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      return {
        provider,
        configured: true,
        ok: res.ok,
        model,
        message: res.ok ? "Groq connection succeeded." : `Groq returned ${res.status}. Check model access.`,
      };
    }

    const url = getOllamaUrl(config);
    const model = config.ollamaModel || DEFAULT_OLLAMA_MODEL;
    const res = await fetch(`${url}/api/tags`);

    return {
      provider,
      configured: true,
      ok: res.ok,
      model,
      message: res.ok ? "Ollama connection succeeded." : `Ollama returned ${res.status}.`,
    };
  } catch (error: any) {
    return {
      provider,
      configured:
        provider === "auto"
          ? Boolean(getGeminiKey() || getGroqKey())
          : provider === "ollama"
            ? true
            : provider === "gemini"
              ? Boolean(getGeminiKey())
              : Boolean(getGroqKey()),
      ok: false,
      model:
        provider === "auto"
          ? `${DEFAULT_GEMINI_MODEL} -> ${DEFAULT_GROQ_MODEL}`
          : provider === "gemini"
          ? config.geminiModel || DEFAULT_GEMINI_MODEL
          : provider === "groq"
            ? config.groqModel || DEFAULT_GROQ_MODEL
            : config.ollamaModel || DEFAULT_OLLAMA_MODEL,
      message: error.message || "Provider connection failed.",
    };
  }
}
