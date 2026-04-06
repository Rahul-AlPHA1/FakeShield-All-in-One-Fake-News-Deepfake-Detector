/// <reference types="vite/client" />
import { GoogleGenAI, Type } from "@google/genai";

export type Provider = 'gemini' | 'groq' | 'ollama';

export interface LLMConfig {
  provider: Provider;
  geminiKey?: string;
  groqKey?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
}

const SYSTEM_PROMPT = `You are an expert investigative journalist and fact-checker. 
Analyze the following news text, claim, or headline for credibility, context, and factual accuracy. 

Determine if it is REAL, FAKE, or MISLEADING. 
Provide a detailed reasoning for your verdict.
Also provide a breakdown of the tone, any logical fallacies present, and a brief fact-check summary.

Respond ONLY with a valid JSON object matching this schema:
{
  "label": "REAL" | "FAKE" | "MISLEADING",
  "confidence": number (0.0 to 1.0),
  "reasoning": "Detailed explanation of why this verdict was reached (2-3 sentences).",
  "breakdown": {
    "tone": "The tone of the text (e.g., Sensationalist, Objective, Alarmist)",
    "logical_fallacies": ["List of any logical fallacies or manipulative tactics used. Empty array if none."],
    "fact_check_summary": "A one-sentence summary of the actual facts."
  },
  "top_keywords": ["Up to 5 relevant keywords from the text"]
}`;

function extractJSON(text: string) {
  if (!text) throw new Error("Received empty response from AI model.");
  
  try {
    return JSON.parse(text);
  } catch (e) {
    // Fallback 1: Extract from markdown code blocks
    const match = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (match && match[1]) {
      try { return JSON.parse(match[1]); } catch (e2) {}
    }
    
    // Fallback 2: Find the first { and last }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try { return JSON.parse(text.substring(start, end + 1)); } catch (e3) {}
    }
    
    console.error("Failed to parse JSON from AI response:", text);
    throw new Error("The AI model did not return a valid JSON format. Please try again.");
  }
}

export async function analyzeText(text: string, sourceUrl: string | null, config: LLMConfig) {
  const prompt = `${SYSTEM_PROMPT}\n\n${sourceUrl ? `Source URL: ${sourceUrl}\n` : ''}Input to analyze: "${text}"`;

  try {
    if (config.provider === 'gemini') {
      if (!config.geminiKey) throw new Error("Gemini API Key is missing. Please configure it in Settings.");
      const ai = new GoogleGenAI({ apiKey: config.geminiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
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
                  fact_check_summary: { type: Type.STRING }
                },
                required: ["tone", "logical_fallacies", "fact_check_summary"]
              },
              top_keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["label", "confidence", "reasoning", "breakdown", "top_keywords"]
          }
        }
      });
      return extractJSON(response.text || "");
    } 
    
    else if (config.provider === 'groq') {
      if (!config.groqKey) throw new Error("Groq API Key is missing. Please configure it in Settings.");
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `${sourceUrl ? `Source URL: ${sourceUrl}\n` : ''}Input to analyze: "${text}"` }
          ],
          response_format: { type: "json_object" }
        })
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Groq API Error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      return extractJSON(data.choices?.[0]?.message?.content || "");
    } 
    
    else if (config.provider === 'ollama') {
      const url = (config.ollamaUrl || "http://localhost:11434").replace(/\/$/, '');
      const model = config.ollamaModel || "llama3";
      
      let res;
      try {
        res = await fetch(`${url}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: `${sourceUrl ? `Source URL: ${sourceUrl}\n` : ''}Input to analyze: "${text}"` }
            ],
            stream: false,
            format: "json"
          })
        });
      } catch (fetchError: any) {
        throw new Error(`Failed to connect to Ollama at ${url}. Ensure Ollama is running and OLLAMA_ORIGINS="*" is set in your environment variables to allow browser connections.`);
      }
      
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Ollama Error (${res.status}): ${errText || res.statusText}`);
      }
      
      const data = await res.json();
      return extractJSON(data.message?.content || "");
    }
    
    throw new Error("Unknown AI provider selected.");
  } catch (error: any) {
    console.error("LLM Service Error:", error);
    throw error;
  }
}

export async function testConnection(config: LLMConfig): Promise<boolean> {
  try {
    if (config.provider === 'gemini') {
      if (!config.geminiKey) return false;
      const ai = new GoogleGenAI({ apiKey: config.geminiKey });
      await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Hi"
      });
      return true;
    } else if (config.provider === 'groq') {
      if (!config.groqKey) return false;
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { "Authorization": `Bearer ${config.groqKey}` }
      });
      return res.ok;
    } else if (config.provider === 'ollama') {
      const url = (config.ollamaUrl || "http://localhost:11434").replace(/\/$/, '');
      const res = await fetch(`${url}/api/tags`);
      return res.ok;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export async function analyzeMedia(file: File, mediaType: 'video' | 'audio', config: LLMConfig) {
  if (config.provider !== 'gemini') {
    throw new Error(`${mediaType === 'video' ? 'Video' : 'Audio'} analysis is currently only supported with Google Gemini. Please switch your provider in Settings.`);
  }

  const base64Data = await fileToBase64(file);
  const mimeType = file.type;

  const apiKey = config.geminiKey || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = mediaType === 'video'
    ? `Analyze this video for signs of being a deepfake or AI-generated. Look for unnatural blink patterns, facial inconsistencies, color bleeding, unnatural noise patterns, and lighting inconsistencies.
       Return ONLY a JSON object with the following structure:
       {
         "label": "DEEPFAKE" or "AUTHENTIC",
         "confidence": <float between 0 and 1>,
         "reasoning": "<detailed explanation of your findings>",
         "breakdown": {
           "blink_pattern": "<observations about blinking>",
           "facial_consistency": "<observations about face stability>",
           "color_bleeding": "<observations about edges and colors>",
           "noise_pattern": "<observations about unnatural smoothness or noise>",
           "lighting_consistency": "<observations about shadows and lighting>"
         },
         "top_keywords": ["deepfake", "manipulation", "authentic", "ai-generated"]
       }`
    : `Analyze this audio for signs of being an AI voice clone or synthetic TTS. Look for unnatural prosody, lack of breathing artifacts, robotic spectral flatness, and uniform frequency bands.
       Return ONLY a JSON object with the following structure:
       {
         "label": "AI GENERATED" or "HUMAN VOICE",
         "confidence": <float between 0 and 1>,
         "reasoning": "<detailed explanation of your findings>",
         "breakdown": {
           "mfcc_variance": "<observations about acoustic consistency>",
           "prosody_pitch": "<observations about pitch smoothness>",
           "spectral_flatness": "<observations about vocoder artifacts>",
           "breathing_artifacts": "<observations about natural breaths>",
           "frequency_bands": "<observations about energy distribution>"
         },
         "top_keywords": ["synthetic", "clone", "natural", "tts"]
       }`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-preview',
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType } }
        ]
      }
    ]
  });

  const text = response.text;
  if (!text) throw new Error("No response received from Gemini.");

  return extractJSON(text);
}
