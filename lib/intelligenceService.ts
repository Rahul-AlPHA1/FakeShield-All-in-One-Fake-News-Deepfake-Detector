export interface SourceTrustResult {
  domain: string;
  score: number;
  rating: "Trusted" | "Mostly reliable" | "Needs caution" | "High risk" | "Unknown";
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

const TRUSTED_DOMAINS = new Map<string, number>([
  ["apnews.com", 92],
  ["reuters.com", 94],
  ["bbc.com", 88],
  ["bbc.co.uk", 88],
  ["npr.org", 86],
  ["pbs.org", 85],
  ["politifact.com", 90],
  ["snopes.com", 86],
  ["factcheck.org", 90],
  ["who.int", 91],
  ["un.org", 88],
  ["nasa.gov", 92],
  ["nature.com", 88],
  ["science.org", 87],
  ["bellingcat.com", 84],
  ["aljazeera.com", 78],
  ["theguardian.com", 80],
  ["nytimes.com", 82],
  ["washingtonpost.com", 81],
  ["wsj.com", 82],
  ["bloomberg.com", 83],
]);

const RISKY_TERMS = [
  "viral",
  "truth",
  "uncensored",
  "exposed",
  "patriot",
  "click",
  "rumor",
  "leak",
  "secret",
  "shocking",
  "realnews",
];

function getHostname(rawUrl: string) {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function getRegisteredDomain(hostname: string) {
  const parts = hostname.split(".").filter(Boolean);
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join(".");
}

function getRating(score: number): SourceTrustResult["rating"] {
  if (score >= 82) return "Trusted";
  if (score >= 68) return "Mostly reliable";
  if (score >= 45) return "Needs caution";
  if (score > 0) return "High risk";
  return "Unknown";
}

export function scoreSourceTrust(sourceUrl?: string | null): SourceTrustResult {
  const domain = sourceUrl ? getHostname(sourceUrl) : "";
  if (!domain) {
    return {
      domain: "Direct submission",
      score: 50,
      rating: "Unknown",
      summary: "No source URL was supplied, so FakeShield can only judge the content, not the publisher or domain.",
      signals: [
        { label: "Source URL", value: "Missing", status: "neutral" },
        { label: "Publisher history", value: "Unavailable", status: "neutral" },
      ],
      reasons: ["Paste a public article URL when possible for a stronger source reliability check."],
    };
  }

  const registeredDomain = getRegisteredDomain(domain);
  let score = TRUSTED_DOMAINS.get(registeredDomain) || 58;
  const reasons: string[] = [];
  const signals: SourceTrustResult["signals"] = [];

  if (TRUSTED_DOMAINS.has(registeredDomain)) {
    reasons.push("Domain appears in FakeShield's trusted publisher and fact-check reference set.");
    signals.push({ label: "Known publisher", value: "Reference match", status: "positive" });
  } else {
    reasons.push("Domain is not in the local trusted-source reference set, so it needs extra verification.");
    signals.push({ label: "Known publisher", value: "No reference match", status: "neutral" });
  }

  if (sourceUrl?.startsWith("https://")) {
    score += 4;
    signals.push({ label: "Transport", value: "HTTPS", status: "positive" });
  } else {
    score -= 8;
    reasons.push("URL does not use HTTPS.");
    signals.push({ label: "Transport", value: "Not HTTPS", status: "negative" });
  }

  if (domain.split("-").length > 2) {
    score -= 8;
    reasons.push("Domain contains multiple hyphens, a common pattern in low-quality clone sites.");
    signals.push({ label: "Domain pattern", value: "Many hyphens", status: "negative" });
  } else {
    signals.push({ label: "Domain pattern", value: "Normal", status: "positive" });
  }

  const riskyTerm = RISKY_TERMS.find((term) => registeredDomain.includes(term));
  if (riskyTerm) {
    score -= 12;
    reasons.push(`Domain contains the loaded term "${riskyTerm}", which can indicate sensational positioning.`);
    signals.push({ label: "Sensational wording", value: riskyTerm, status: "negative" });
  }

  const tld = registeredDomain.split(".").pop() || "";
  if (["xyz", "top", "click", "work", "zip"].includes(tld)) {
    score -= 10;
    reasons.push(`Domain uses .${tld}, which deserves additional scrutiny for news claims.`);
    signals.push({ label: "TLD risk", value: `.${tld}`, status: "negative" });
  } else {
    signals.push({ label: "TLD risk", value: `.${tld || "unknown"}`, status: "neutral" });
  }

  score = Math.max(5, Math.min(98, score));
  const rating = getRating(score);

  return {
    domain: registeredDomain || domain,
    score,
    rating,
    summary:
      rating === "Trusted"
        ? "This source has strong reliability signals, but individual claims still need evidence."
        : rating === "Mostly reliable"
          ? "This source has some positive reliability signals, with normal verification still recommended."
          : rating === "Needs caution"
            ? "This source needs corroboration from stronger outlets before trusting the claim."
            : "This source has multiple risk signals. Treat the claim as unverified until independently confirmed.",
    signals,
    reasons,
  };
}

function buildTimelineQuery(query: string, sourceUrl?: string | null) {
  const domain = sourceUrl ? getRegisteredDomain(getHostname(sourceUrl)) : "";
  const cleaned = query.replace(/[^\p{L}\p{N}\s"'’-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 160);
  if (domain && cleaned) return `"${cleaned}" OR domain:${domain}`;
  return cleaned || domain || "misinformation fact check";
}

function parseGdeltDate(value: string) {
  if (!value) return new Date().toISOString();
  const compact = value.replace(/\D/g, "");
  if (compact.length >= 8) {
    const year = compact.slice(0, 4);
    const month = compact.slice(4, 6);
    const day = compact.slice(6, 8);
    const hour = compact.slice(8, 10) || "00";
    const minute = compact.slice(10, 12) || "00";
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`).toISOString();
  }
  return new Date(value).toISOString();
}

export async function getEvidenceTimeline(
  query: string,
  sourceUrl?: string | null,
): Promise<{ source: string; items: EvidenceTimelineItem[] }> {
  const timelineQuery = buildTimelineQuery(query, sourceUrl);
  const params = new URLSearchParams({
    query: timelineQuery,
    mode: "ArtList",
    format: "json",
    maxrecords: "12",
    sort: "DateAsc",
    timespan: "30d",
  });

  try {
    const response = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`, {
      headers: { "User-Agent": "FakeShield/1.0 evidence timeline" },
    });

    if (!response.ok) throw new Error(`GDELT returned ${response.status}`);

    const data = await response.json();
    const seenUrls = new Set<string>();
    const items = (data.articles || [])
      .filter((article: any) => article?.url && article?.title && !seenUrls.has(article.url))
      .map((article: any, index: number) => {
        seenUrls.add(article.url);
        const hostname = getHostname(article.url) || article.domain || "News source";
        return {
          id: `${index}-${article.url}`.slice(0, 180),
          date: parseGdeltDate(article.seendate || article.date || ""),
          title: article.title,
          source: hostname,
          url: article.url,
          type: index === 0 ? "origin" : "coverage",
          note: index === 0 ? "Earliest matching coverage found in the live timeline query." : "Related coverage found after the first matching item.",
        } satisfies EvidenceTimelineItem;
      })
      .slice(0, 8);

    if (items.length) return { source: "GDELT DOC 2.0", items };
  } catch {}

  const now = Date.now();
  return {
    source: "Local fallback",
    items: [
      {
        id: "fallback-submitted",
        date: new Date(now - 60 * 60 * 1000).toISOString(),
        title: sourceUrl ? "Submitted source captured" : "Claim submitted directly",
        source: sourceUrl ? getRegisteredDomain(getHostname(sourceUrl)) : "FakeShield",
        url: sourceUrl || undefined,
        type: "origin",
        note: "FakeShield stored the submitted item as the starting point because live timeline search is unavailable.",
      },
      {
        id: "fallback-source-check",
        date: new Date(now - 30 * 60 * 1000).toISOString(),
        title: "Source and claim context inspected",
        source: "FakeShield",
        type: "verification",
        note: "Source trust and content-level signals were evaluated for reliability context.",
      },
      {
        id: "fallback-next-step",
        date: new Date(now).toISOString(),
        title: "External corroboration recommended",
        source: "FakeShield",
        type: "context",
        note: "Check established fact-checkers, official sources, and earlier uploads before sharing.",
      },
    ],
  };
}
