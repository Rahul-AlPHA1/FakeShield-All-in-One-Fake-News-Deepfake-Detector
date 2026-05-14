import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import fs from "fs";
import * as cheerio from "cheerio";
import axios from "axios";
import "./lib/loadEnv";
import {
  analyzeMediaWithProvider,
  compareClaimsWithProvider,
  analyzeTextWithProvider,
  getProviderSummary,
  testProviderConnection,
  type LLMConfig,
  type MediaType,
} from "./lib/providerService.js";
import { getTrendingMisinformation } from "./lib/trendingService.js";
import { getEvidenceTimeline, scoreSourceTrust } from "./lib/intelligenceService.js";

const PRIVATE_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function validatePublicHttpUrl(rawUrl: string) {
  const parsed = new URL(rawUrl);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }
  if (PRIVATE_HOSTS.has(parsed.hostname)) {
    throw new Error("Local or private URLs are not allowed.");
  }
  return parsed.toString();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(cors());
  app.use(express.json({ limit: "25mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", model_loaded: true });
  });

  app.get("/api/providers", (req, res) => {
    res.json({ providers: getProviderSummary() });
  });

  app.get("/api/trending", async (req, res) => {
    const result = await getTrendingMisinformation();
    res.json(result);
  });

  app.post("/api/source-trust", (req, res) => {
    const { sourceUrl } = req.body || {};
    res.json(scoreSourceTrust(sourceUrl || null));
  });

  app.post("/api/evidence-timeline", async (req, res) => {
    const { query, sourceUrl } = req.body || {};
    const result = await getEvidenceTimeline(String(query || ""), sourceUrl || null);
    res.json(result);
  });

  app.post("/api/compare-claims", async (req, res) => {
    const { left, right, config } = req.body || {};
    if (!left || !right || String(left).trim().length < 10 || String(right).trim().length < 10) {
      return res.status(400).json({ error: "Both claims need at least 10 characters." });
    }

    try {
      const result = await compareClaimsWithProvider(String(left), String(right), config || { provider: "auto" });
      res.json(result);
    } catch (err: any) {
      console.error("Claim Comparison Error:", err.message);
      res.status(500).json({ error: err.message || "Claim comparison failed." });
    }
  });

  app.post("/api/providers/test", async (req, res) => {
    try {
      const config = (req.body?.config || { provider: req.body?.provider || "gemini" }) as LLMConfig;
      const result = await testProviderConnection(config);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Provider test failed." });
    }
  });

  app.post("/api/analyze-text", async (req, res) => {
    const { text, sourceUrl, config } = req.body || {};

    if (!text || typeof text !== "string" || text.trim().length < 10) {
      return res.status(400).json({ error: "Please enter more text (at least 10 characters)." });
    }

    try {
      const result = await analyzeTextWithProvider(text, sourceUrl || null, config || { provider: "auto" });
      res.json(result);
    } catch (err: any) {
      console.error("Text Analysis Error:", err.message);
      res.status(500).json({ error: err.message || "Text analysis failed." });
    }
  });

  app.post("/api/analyze-media", async (req, res) => {
    const { base64Data, mimeType, mediaType, config } = req.body || {};

    if (!base64Data || !mimeType || !["video", "audio", "image"].includes(mediaType)) {
      return res.status(400).json({ error: "Missing media payload." });
    }

    try {
      const result = await analyzeMediaWithProvider(
        base64Data,
        mimeType,
        mediaType as MediaType,
        config || { provider: "auto" },
      );
      res.json(result);
    } catch (err: any) {
      console.error("Media Analysis Error:", err.message);
      res.status(500).json({ error: err.message || "Media analysis failed." });
    }
  });

  app.post("/api/scrape", async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "No URL provided" });
    }

    try {
      const safeUrl = validatePublicHttpUrl(url);
      
      // Fetch URL content
      const response = await axios.get(safeUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        timeout: 15000,
        maxRedirects: 5
      });
      
      const $ = cheerio.load(response.data);
      
      // Remove scripts, styles, nav, footer
      $('script, style, nav, footer, header, aside, iframe, noscript').remove();
      
      // Extract text from paragraphs and headings
      const articleText = $('article, main, p, h1, h2, h3').text().replace(/\s+/g, ' ').trim();
      
      if (articleText.length < 50) {
        return res.status(400).json({ error: "Could not extract enough meaningful text from this URL." });
      }
      
      const contentToAnalyze = articleText.substring(0, 15000); // Limit to ~15k chars
      res.json({ text: contentToAnalyze });
    } catch (err: any) {
      console.error("URL Fetch Error:", err.message);
      return res.status(400).json({ error: "Failed to fetch or parse the URL. Make sure it's a valid, publicly accessible link." });
    }
  });

  app.post("/api/feedback", (req, res) => {
    const { text, predicted_label, correct_label } = req.body;
    
    if (!text || !predicted_label || !correct_label) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const feedbackEntry = {
      timestamp: Date.now(),
      text,
      predicted_label,
      correct_label
    };
    
    const feedbackFile = path.join(process.cwd(), 'feedback.json');
    
    try {
      let feedbacks = [];
      if (fs.existsSync(feedbackFile)) {
        const data = fs.readFileSync(feedbackFile, 'utf8');
        feedbacks = JSON.parse(data);
      }
      
      feedbacks.push(feedbackEntry);
      fs.writeFileSync(feedbackFile, JSON.stringify(feedbacks, null, 2));
      
      res.json({ status: "success", message: "Feedback recorded" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true"
          ? false
          : { port: Number(process.env.HMR_PORT || 24679) },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
