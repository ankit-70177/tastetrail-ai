# PROJECT-BRIEF.md — TasteTrail AI

## 1. Executive Summary
- **Project Name**: TasteTrail AI
- **Tagline**: Discover What You'll Actually Love — Agentic Cultural Discovery Platform Powered by Qloo's Cultural Taste Intelligence
- **Target Hackathon**: Qloo Agentic Hackathon
- **Selected Track**: Agentic Cultural Discovery
- **Primary Audience**: Cultural explorers, travelers, developers, and hackathon judges seeking taste-grounded discovery

---

## 2. Problem Statement
Generic travel planners, search engines, and mainstream LLMs default to superficial popularity metrics and tourist cliches. When a user requests recommendations based on nuanced taste profiles (such as indie rock, Korean street food, brutalist architecture, or artisan third-wave coffee), generic engines recommend overcrowded landmarks and commercial shopping centers because they optimize for raw search frequency rather than cultural affinity. Generic AI guesses; it does not understand cross-domain cultural connections.

---

## 3. Proposed Solution
TasteTrail AI solves this by anchoring its agentic planning engine directly to **Qloo's cultural intelligence graph**. It resolves natural language interests to canonical entity URNs (`urn:entity:music:genre:indie-rock`, `urn:entity:place:restaurant`, etc.), queries Qloo's `/v2/insights` endpoint with cross-domain affinity correlations, and compiles a time-slotted, budget-conscious 2-day itinerary where every stop displays verifiable Qloo evidence.

### Core User Journey
1. **User Action**: The user inputs destination, budget, atmosphere, and taste interests (or selects 1-click curated presets like Delhi Indie/Korean, Tokyo Jazz/Architecture, or London Vinyl/Pubs).
2. **System Processing**: TasteAgent parses input, resolves entity seeds via Qloo `/search`, queries `/v2/insights` with cross-domain signals, generates a comparative generic popularity baseline, and structures schedule slots (Morning, Midday, Late Afternoon, Evening).
3. **Outcome / Value Delivered**: An interactive editorial itinerary with affinity scores, budget projections, Qloo inspector trace, side-by-side baseline comparison modal, and conversational real-time refinement ("Make it cheaper", "More art").

---

## 4. Differentiating Superpower
- **Direct Grounding in Qloo Cultural Intelligence**: Recommendations are rooted in empirical cross-domain affinity correlations, not generic LLM hallucinations.
- **Side-by-Side Generic Baseline Comparison**: Transparently demonstrates the difference between mainstream popularity cliches and Qloo's taste-tailored discovery.
- **Conversational Agentic Refinement**: Real-time re-ranking and budget re-allocation without full page reloads.
- **Dual-Mode Resilience**: Instant toggle between live Qloo API and authentic offline schema fixtures with full zero-leak secret protection.

---

## 5. Technology Stack & Mandatory Requirements
- **Frontend**: React 18 + Vite SPA, React Router 6, Editorial Midnight Design System, Glassmorphic UI, Google Fonts (Outfit & Inter)
- **Backend API**: Node.js 24 Native ES Modules, Express 4.21, zero-leak credential proxy
- **Mandatory Sponsor Integration**: Qloo Hackathon API (`https://hackathon.api.qloo.com`) implementing `/search` and `/v2/insights` with `X-Api-Key` headers and schema normalization
- **Database / Cache**: In-memory session cache & browser LocalStorage for saved trips with JSON export
- **Hosting / Deployment Target**: Render (`render.yaml`), Vercel (`vercel.json`), or Railway

---

## 6. Track & Judging Alignment
- **Technical Complexity**: Complete entity resolution pipeline, schema validation, HTTP 429 rate limit backoff, response normalization across nested Qloo formats, and 23 automated tests.
- **Originality**: Solves LLM generic popularity hallucination by fusing multi-domain cultural affinity graph intelligence into dynamic travel planning.
- **Design & UX**: High-end editorial travel magazine aesthetic, accessible modals, responsive layouts, 1-click judge presets, and live taste genome editor.
- **Business Potential**: Immediate viability as a consumer travel copilot, boutique concierge platform, or B2B recommendation engine for hospitality and airline partners.

---

## 7. Risks & Fallback Strategy
- **Risk 1**: Upstream Qloo API rate limit (HTTP 429) or missing API key during evaluation.
  - *Mitigation*: Automatic backoff retry logic and deterministic authentic Qloo schema fixtures labeled `sourceMode: demo_fixture`.
- **Risk 2**: Client/Server secret leakage.
  - *Mitigation*: Qloo API credentials reside strictly server-side; all requests proxied with header sanitization.

---

## 8. Definition of Done
- [x] Core happy path end-to-end verified.
- [x] 7 verification layers passing.
- [x] Responsive UI with dark mode & micro-animations.
- [x] Live deployment active or local ready with clean instructions.
- [x] Demo video script recorded.
