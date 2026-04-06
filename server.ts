import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import * as cheerio from "cheerio";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", model_loaded: true });
  });

  app.post("/api/scrape", async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "No URL provided" });
    }

    try {
      // Basic URL validation
      new URL(url);
      
      // Fetch URL content
      const response = await axios.get(url, {
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
      server: { middlewareMode: true },
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
