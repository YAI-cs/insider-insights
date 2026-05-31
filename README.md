# Insider Insights

A real-time intelligence terminal for tracking disclosed trades by high-profile political and corporate insiders. Surfaces Form 4 filings, STOCK Act disclosures, and Congressional PTRs — timed, annotated, and AI-enriched.

Tracks: Donald Trump, Nancy Pelosi, Elon Musk, RFK Jr.

## Features

- **Trade Timeline**: Chronological view of insider trades plotted against market events and policy announcements
- **Insider Leaderboard**: Rank insiders by estimated edge and trade performance
- **Disclosure Intelligence**: Every Form 4 is timestamped, lag-tracked, and annotated with LLM-generated context
- **AI-enriched pipeline**: EDGAR + Yahoo Finance data, enriched via OpenAI-compatible LLM
- **Auth**: Email/password via Better Auth; landing page public, dashboard protected

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind v4, shadcn/ui |
| Database | PostgreSQL via Prisma |
| Auth | Better Auth |
| Data sources | SEC EDGAR, Yahoo Finance, Congress.gov |
| AI enrichment | OpenAI-compatible API (configurable model) |

## Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing page |
| `/dashboard` | Auth required | Main terminal |
| `/insiders/[id]` | Auth required | Insider profile |
| `/sign-in` | Public | Login |
| `/sign-up` | Public | Registration |
| `/api/insiders` | Auth required | REST: insider list |
| `/api/trades` | Auth required | REST: trade list |
| `/api/data/refresh` | Auth required | Trigger data pipeline |

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set environment variables

Copy `.env` and fill in values:

```bash
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/insider_insights

# Better Auth secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-secret

# AI data pipeline (OpenAI-compatible endpoint)
BACKEND_API_URL=https://api.openai.com/v1
BACKEND_API_KEY=sk-...
BACKEND_MODEL=gpt-4o-mini   # optional, defaults to gpt-4o-mini
```

### 3. Set up the database

```bash
pnpm prisma migrate dev
```

### 4. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page. Sign up for an account, then access the terminal at `/dashboard`.

## Data Pipeline

The pipeline runs on demand via `POST /api/data/refresh` (or the refresh button in the terminal). It:

1. Fetches Form 4 filings from **SEC EDGAR** for tracked CIKs
2. Pulls current and historical price data from **Yahoo Finance**
3. Sends each trade through an **LLM** to generate disclosure context and timing annotations
4. Persists everything to PostgreSQL

The dashboard falls back to mock data if the database is unavailable or empty.

## Design

Dark terminal aesthetic. Forced dark mode. Amber primary palette (`#f59e0b`). Monospace (Geist Mono) for all data values. Display type (Oxanium 800) for headlines. No light mode.

Anti-references: Reddit/WSB energy, traditional Bloomberg orange-on-black, SaaS dashboard clichés.
