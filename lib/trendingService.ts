export interface TrendingItem {
  id: string;
  topic: string;
  description: string;
  region: string;
  risk: "Critical" | "High" | "Medium";
  url: string;
  source: string;
  publishedAt?: string;
}

const FALLBACK_TRENDS: TrendingItem[] = [
  {
    id: "fallback-ai-political-audio",
    topic: "AI-Generated Political Audio",
    description: "Synthetic political audio and cloned-voice clips continue to circulate across social platforms.",
    region: "Global",
    risk: "High",
    url: "https://www.reuters.com/fact-check/",
    source: "Fallback",
  },
  {
    id: "fallback-election-misinformation",
    topic: "Election Misinformation Narratives",
    description: "False polling claims, edited speeches, and misleading voting-process posts often spike during election cycles.",
    region: "Global",
    risk: "High",
    url: "https://www.politifact.com/factchecks/",
    source: "Fallback",
  },
  {
    id: "fallback-crypto-scams",
    topic: "Fake Crypto Giveaway Streams",
    description: "Deepfake and recycled livestreams impersonating public figures are used to push crypto scams.",
    region: "Global",
    risk: "Critical",
    url: "https://www.snopes.com/fact-check/",
    source: "Fallback",
  },
  {
    id: "fallback-health-rumors",
    topic: "Health Cure Rumors",
    description: "Unverified medical cures and recycled health claims can resurface quickly across messaging apps and short-video platforms.",
    region: "Global",
    risk: "High",
    url: "https://www.who.int/news-room/spotlight/let-s-flatten-the-infodemic-curve",
    source: "Fallback",
  },
  {
    id: "fallback-manipulated-images",
    topic: "Manipulated Images During Breaking News",
    description: "Old, edited, and AI-generated visuals are commonly reshared during major breaking-news events.",
    region: "Global",
    risk: "High",
    url: "https://www.politifact.com/factchecks/",
    source: "Fallback",
  },
  {
    id: "fallback-conflict-footage",
    topic: "Old Conflict Footage Reposted As New",
    description: "Videos from older wars, disasters, or protests are frequently mislabeled as current events during breaking news.",
    region: "Middle East / Europe / Asia",
    risk: "High",
    url: "https://www.bellingcat.com/",
    source: "Fallback",
  },
  {
    id: "fallback-weather-disaster-media",
    topic: "Disaster Visuals With False Location Claims",
    description: "Storm, flood, and earthquake images are often shared with incorrect locations or dates to inflate panic.",
    region: "Global",
    risk: "Medium",
    url: "https://www.reuters.com/fact-check/",
    source: "Fallback",
  },
  {
    id: "fallback-celebrity-deepfakes",
    topic: "Celebrity Deepfake Endorsements",
    description: "AI-generated videos and cloned voices impersonate public figures to promote investments, products, or fake apps.",
    region: "Global",
    risk: "Critical",
    url: "https://www.snopes.com/fact-check/",
    source: "Fallback",
  },
  {
    id: "fallback-financial-fraud",
    topic: "Banking And Loan Fraud Messages",
    description: "Fraudulent posts imitate banks, government portals, and fintech services to collect credentials or payment details.",
    region: "South Asia / Africa / Global",
    risk: "Critical",
    url: "https://www.reuters.com/fact-check/",
    source: "Fallback",
  },
  {
    id: "fallback-ai-image-hoaxes",
    topic: "AI-Generated Viral Images",
    description: "Highly emotional AI images are used to create false context around protests, disasters, public figures, and social issues.",
    region: "Global",
    risk: "High",
    url: "https://www.bbc.com/news/reality_check",
    source: "Fallback",
  },
  {
    id: "fallback-platform-impersonation",
    topic: "Fake Platform Verification Notices",
    description: "Scam pages mimic account verification, copyright strikes, or security alerts to steal social media credentials.",
    region: "Global",
    risk: "Medium",
    url: "https://www.snopes.com/fact-check/",
    source: "Fallback",
  },
  {
    id: "fallback-local-language-rumors",
    topic: "Local-Language Rumor Chains",
    description: "Regional-language voice notes and forwarded screenshots spread quickly because they feel familiar and hard to trace.",
    region: "South Asia / Middle East / Africa",
    risk: "High",
    url: "https://www.reuters.com/fact-check/",
    source: "Fallback",
  },
];

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedResponse: { expiresAt: number; data: { updatedAt: string; items: TrendingItem[]; source: string } } | null = null;

function inferRisk(title: string): TrendingItem["risk"] {
  const value = title.toLowerCase();
  if (value.includes("deepfake") || value.includes("scam") || value.includes("fraud")) return "Critical";
  if (value.includes("fake") || value.includes("misinformation") || value.includes("disinformation")) return "High";
  return "Medium";
}

function normaliseArticle(article: any, index: number): TrendingItem | null {
  const title = String(article?.title || "").trim();
  const url = String(article?.url || "").trim();
  if (!title || !url) return null;

  let source = article?.domain || "News source";
  try {
    source = new URL(url).hostname.replace(/^www\./, "");
  } catch {}

  return {
    id: `${source}-${article?.seendate || index}-${title}`.replace(/\s+/g, "-").slice(0, 160),
    topic: title,
    description: `Recent ${source} coverage matching misinformation, fact-check, fake news, or deepfake signals.`,
    region: article?.sourceCountry || article?.language || "Global",
    risk: inferRisk(title),
    url,
    source,
    publishedAt: article?.seendate,
  };
}

export async function getTrendingMisinformation(): Promise<{ updatedAt: string; items: TrendingItem[]; source: string }> {
  if (cachedResponse && cachedResponse.expiresAt > Date.now()) {
    return cachedResponse.data;
  }

  const params = new URLSearchParams({
    query: '("fake news" OR misinformation OR disinformation OR deepfake OR "fact check")',
    mode: "ArtList",
    format: "json",
    maxrecords: "30",
    sort: "DateDesc",
    timespan: "7d",
  });

  const endpoint = `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": "FakeShield/1.0 misinformation trend monitor",
      },
    });

    if (!response.ok) {
      throw new Error(`GDELT returned ${response.status}`);
    }

    const data = await response.json();
    const seenUrls = new Set<string>();
    const items = (data.articles || [])
      .map(normaliseArticle)
      .filter((item: TrendingItem | null): item is TrendingItem => {
        if (!item || seenUrls.has(item.url)) return false;
        seenUrls.add(item.url);
        return true;
      })
      .slice(0, 24);

    const result = {
      updatedAt: new Date().toISOString(),
      items: items.length ? items : FALLBACK_TRENDS,
      source: items.length ? "GDELT DOC 2.0" : "Fallback",
    };
    cachedResponse = { expiresAt: Date.now() + CACHE_TTL_MS, data: result };
    return result;
  } catch (error) {
    const result = {
      updatedAt: new Date().toISOString(),
      items: FALLBACK_TRENDS,
      source: "Fallback",
    };
    cachedResponse = { expiresAt: Date.now() + 60 * 1000, data: result };
    return result;
  }
}
