# FakeShield

![Visitors](https://api.visitorbadge.io/api/visitors?path=Rahul-AlPHA1.FakeShield&countColor=%23263759)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support%20My%20Work-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/rg9859943c)

**FakeShield** is an AI-powered media intelligence platform built by **Rahool Gir** for misinformation detection, source reliability analysis, claim comparison, deepfake review, voice clone inspection, and global fake-news monitoring.

It started as a fake-news detector and has evolved into a production-style investigation workspace with multimodal AI analysis, provider fallback, live watchlists, source trust scoring, evidence timelines, community review workflows, and shareable verification reports.

## Live Product Screenshots

These screenshots are captured from the current FakeShield UI.

### Dashboard
![FakeShield dashboard](docs/screenshots/dashboard-dark.png)

### Analysis Workspace
![FakeShield analysis workspace](docs/screenshots/analysis-dark.png)

### Global Watchlist
![FakeShield global watchlist](docs/screenshots/watchlist-dark.png)

### Light Theme
![FakeShield light theme](docs/screenshots/analysis-light.png)

## Core Capabilities

### Text And URL Misinformation Analysis

FakeShield can analyze raw text, headlines, claims, and full article URLs. For URLs, the backend uses a protected scraper flow that fetches public pages, removes noisy page elements, extracts meaningful article text, and sends the cleaned content into the AI analysis pipeline.

The result includes:

- Verdict: `REAL`, `FAKE`, or `MISLEADING`
- Confidence score
- Evidence-focused reasoning
- Tone and manipulation signals
- Logical fallacies or persuasion tactics
- Source reliability note
- Extracted claim-level findings
- Recommended verification steps
- Top keywords and entities

This is useful when a user wants to check a viral claim, suspicious article, social media caption, forwarded message, or breaking-news post before sharing it.

### Image Deepfake And Manipulation Review

The image analyzer supports AI-generated image and manipulation checks using Gemini multimodal analysis. It looks for visual artifacts such as inconsistent hands, faces, shadows, text distortion, repeated textures, unnatural lighting, and digital editing clues.

This feature helps detect:

- AI-generated political images
- Manipulated disaster photos
- Fake celebrity or public-figure images
- Edited screenshots
- Misleading image posts reused with false context

### Video Deepfake Review

The video analyzer is designed for visual deepfake inspection. It checks for facial inconsistency, unnatural blinking, lighting mismatch, compression artifacts, edge bleeding, temporal jitter, and frame-level manipulation signals.

This is useful for:

- Political deepfake clips
- Fake press conference videos
- Old videos reshared as new events
- Manipulated social media reels
- Synthetic public-figure content

### Voice Clone Detection

FakeShield can inspect audio files for synthetic voice and AI voice-clone signals. The analysis looks at prosody, pitch variation, breathing patterns, unnatural pauses, spectral consistency, vocoder artifacts, and TTS-like delivery.

This is useful for:

- Fake leaked-call audio
- Political robocalls
- Voice scam verification
- AI-generated public statements
- Synthetic WhatsApp voice notes

## Advanced Intelligence Features

### Source Trust Graph

The Source Trust Graph scores a submitted domain or URL so users can understand whether the article source appears reliable, unknown, or risky.

It checks:

- Known trusted publisher references
- HTTPS usage
- Domain pattern quality
- Suspicious TLDs
- Sensational wording inside the domain
- Whether the input was direct text or a public URL

The score helps users answer a simple question: **Can this source be trusted enough, or should the claim be verified elsewhere first?**

### Evidence Timeline

Evidence Timeline builds a timeline around a claim, source, or URL. It tries to find related coverage through GDELT DOC 2.0 and falls back to a local verification timeline when live search is unavailable.

It helps identify:

- The earliest matching coverage
- Whether the content is old but being reshared as new
- Related articles or verification context
- A recommended next step for corroboration

This is especially important for misinformation where an old video, image, or quote is reused during a new breaking-news event.

### Claim Comparison Mode

Claim Comparison Mode lets users paste two claims or article excerpts side by side. The AI compares them and returns:

- Overall comparison verdict
- Confidence score
- Shared claims
- Contradictions
- Missing context
- Recommended verification actions

This is useful when two posts tell different versions of the same story, or when a misleading post copies real reporting but changes one important detail.

### Alert Watch Channels

Alert Watch Channels allow users to save keywords or topics such as `deepfake`, `election`, `health`, `crypto`, or a public figure name. FakeShield compares saved topics against the live misinformation watchlist and highlights matching global items.

This turns the app from a single analyzer into a lightweight monitoring system for:

- Journalists
- Students
- Fact-checking teams
- Security researchers
- Social media moderators

### Community Review Queue

The Community Review Queue is a human verification workflow. After an analysis result, a user can add the case to a local review queue with reviewer notes and evidence links.

Each review item stores:

- Case title
- AI verdict
- Confidence
- Notes
- Evidence links
- Open or reviewed status

This is important because high-stakes claims should not rely only on AI. FakeShield supports an AI plus human review model.

### Public Share Report

FakeShield can generate a clean public report link for an analyzed item. The report includes:

- Verdict
- Confidence
- Reasoning
- Source trust score
- Evidence timeline
- Generated timestamp

This is useful when a user wants to share a verification summary with a class, team, journalist, editor, or social media audience.

## Dashboard And Local Intelligence Cache

The Dashboard stores completed analysis cards in browser localStorage for 30 minutes. This means the latest reports stay visible after a reload without sending secrets or private state to a database.

Dashboard metrics include:

- Saved reports
- Authentic verdict count
- Risk flag count
- Average confidence
- Recent analyzed intelligence cards
- Community review queue summary
- Production roadmap modules

## Live Global Misinformation Watch

FakeShield fetches recent global misinformation, fake-news, fact-check, and deepfake coverage from **GDELT DOC 2.0**. The watchlist refreshes automatically every 5 minutes.

If live feed access is unavailable, FakeShield uses a built-in fallback watchlist covering:

- AI-generated political audio
- Election misinformation narratives
- Fake crypto giveaway streams
- Health rumor chains
- Manipulated breaking-news images
- Old conflict footage reposted as new
- Disaster visuals with false location claims
- Celebrity deepfake endorsements
- Banking and loan fraud messages
- AI-generated viral images
- Platform impersonation scams
- Local-language rumor chains

## AI Provider Architecture

FakeShield uses backend-only API keys. Users of the live app do not need to enter provider keys.

### Auto Fallback Flow

For text and claim comparison:

1. Gemini is tried first.
2. If Gemini is missing, rate-limited, or quota-limited, FakeShield falls back to Groq.
3. If both providers hit quota limits, the app returns a clear daily-limit message.

For media analysis:

- Gemini is required because image, video, and audio analysis need multimodal support.
- Groq currently supports text and comparison workflows only.

Supported environment variables:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant

OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
ALLOW_REMOTE_OLLAMA=false
```

## Tech Stack

### Frontend

- React 19
- TypeScript
- Tailwind CSS v4
- Motion for React
- Lucide Icons
- Vite
- Dark and light theme system
- Glassmorphism HUD interface

### Backend

- Node.js
- Express.js
- Vercel Serverless API routes
- Cheerio for URL scraping
- GDELT DOC 2.0 integration
- Provider fallback service
- Local intelligence scoring service

### AI And Intelligence

- Google Gemini for multimodal analysis
- Groq for fast text fallback and claim comparison
- Optional Ollama support for local text workflows
- Source trust scoring
- Evidence timeline generation
- Claim comparison JSON pipeline

## Project Structure

```text
FakeShield/
├── api/
│   ├── analyze-text.ts
│   ├── analyze-media.ts
│   ├── compare-claims.ts
│   ├── evidence-timeline.ts
│   ├── source-trust.ts
│   ├── providers.ts
│   ├── scrape.ts
│   └── trending.ts
├── lib/
│   ├── providerService.ts
│   ├── intelligenceService.ts
│   ├── trendingService.ts
│   └── loadEnv.ts
├── src/
│   ├── components/
│   ├── services/
│   ├── App.tsx
│   └── index.css
├── docs/
│   └── screenshots/
├── server.ts
├── vercel.json
├── vite.config.ts
└── package.json
```

## Local Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Add Local API Keys

Use `.env.local` for private local keys. This file is ignored by Git.

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

Do not commit `.env` or `.env.local`.

### 3. Start Development Server

```bash
npm run dev
```

Default URL:

```text
http://localhost:3000
```

If port 3000 is busy:

```bash
PORT=3101 npm run dev
```

Then open:

```text
http://localhost:3101
```

## Vercel Deployment

Local `.env` files are not uploaded to Vercel. Add keys in the Vercel dashboard:

```text
Project Settings -> Environment Variables
```

Add these for **Production** and **Preview**:

```env
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.1-8b-instant
```

After saving environment variables, redeploy the latest deployment.

Provider check endpoint:

```text
https://your-site.vercel.app/api/providers
```

Expected result:

- Gemini configured: `true`
- Groq configured: `true`

## API Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Server health check |
| `GET /api/providers` | Shows configured AI providers |
| `POST /api/providers/test` | Tests provider connection |
| `POST /api/analyze-text` | Text and URL-content misinformation analysis |
| `POST /api/analyze-media` | Image, video, and audio analysis through Gemini |
| `POST /api/scrape` | Protected public URL scraping |
| `GET /api/trending` | Global misinformation watchlist |
| `POST /api/source-trust` | Domain/source reliability score |
| `POST /api/evidence-timeline` | Claim/source timeline |
| `POST /api/compare-claims` | Side-by-side claim comparison |

## Security Notes

- API keys stay on the backend only.
- The frontend does not expose Gemini or Groq keys.
- `.env`, `.env.local`, and `.env.production.local` are ignored by Git.
- URL scraping blocks local and private hostnames.
- Remote Ollama is disabled unless `ALLOW_REMOTE_OLLAMA=true`.
- Public share reports are hash-based and intended for lightweight sharing, not private evidence storage.

## Smoke Test Commands

```bash
npm run lint
npm run build
curl http://localhost:3101/api/providers
```

Example source trust check:

```bash
curl -X POST http://localhost:3101/api/source-trust \
  -H "Content-Type: application/json" \
  -d '{"sourceUrl":"https://www.reuters.com/world/test-story"}'
```

Example claim comparison:

```bash
curl -X POST http://localhost:3101/api/compare-claims \
  -H "Content-Type: application/json" \
  -d '{
    "left":"The bridge opened after repairs were completed.",
    "right":"The bridge is still closed and repairs have not started.",
    "config":{"provider":"auto","language":"English"}
  }'
```

## Author

**Rahool Gir**  
Senior Software Engineer  
Java · Microservices · Full-Stack | Fintech & Core Banking

- Portfolio: [rahul-alpha1.github.io/RahoolPortfolio.com](https://rahul-alpha1.github.io/RahoolPortfolio.com)
- LinkedIn: [linkedin.com/in/rahool-goswami-4b055a126](https://linkedin.com/in/rahool-goswami-4b055a126)
- GitHub: [@Rahul-AlPHA1](https://github.com/Rahul-AlPHA1)
- Email: [rahool.goswami16@gmail.com](mailto:rahool.goswami16@gmail.com)
- Location: Karachi, Pakistan

## Support

If this project helps you, you can support future development here:

<a href="https://www.buymeacoffee.com/rg9859943c" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
