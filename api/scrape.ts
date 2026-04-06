import * as cheerio from "cheerio";
import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: "No URL provided" });
  }

  try {
    new URL(url);
    
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
    
    $('script, style, nav, footer, header, aside, iframe, noscript').remove();
    
    const articleText = $('article, main, p, h1, h2, h3').text().replace(/\s+/g, ' ').trim();
    
    if (articleText.length < 50) {
      return res.status(400).json({ error: "Could not extract enough meaningful text from this URL." });
    }
    
    const contentToAnalyze = articleText.substring(0, 15000);
    res.status(200).json({ text: contentToAnalyze });
  } catch (err) {
    console.error("URL Fetch Error:", err.message);
    return res.status(400).json({ error: "Failed to fetch or parse the URL. Make sure it's a valid, publicly accessible link." });
  }
}
