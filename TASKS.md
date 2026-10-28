# TASKS.md — TasteTrail AI Task Board

## Priority 1: Core Vertical Slice (The Happy Path)
- [x] **Task 1.1: Project Bootstrap & Health Endpoint**
  - Priority: P0 (Blocker)
  - Status: DONE
  - Acceptance Criteria: App dependencies installed, dev server starts, `/api/health` returns HTTP 200 OK.
  - Verification Evidence: Verified via `tests/apiRoutes.test.js` (`GET /api/health` status 200, service "TasteTrail AI").
- [x] **Task 1.2: Core Input UI & Schema Validation**
  - Priority: P0 (Blocker)
  - Status: DONE
  - Acceptance Criteria: Form accepts user query/data, parses destination, budget, atmosphere, and interests.
  - Verification Evidence: Verified via `tests/tasteAgent.test.js` (`parseRequest` extracts destination, budget, atmosphere, and interests).
- [x] **Task 1.3: End-to-End Core User Journey**
  - Priority: P0 (Blocker)
  - Status: DONE
  - Acceptance Criteria: User can submit input and receive structured result in the UI without errors.
  - Verification Evidence: `POST /api/plan` returns 2-day structured itinerary with slots and budget projections.

---

## Priority 2: Sponsor Tech & Qloo Integration (Phase 2 Verified)
- [x] **Task 2.1: Qloo API Client & Authentication**
  - Priority: P0 (Blocker)
  - Status: DONE
  - Acceptance Criteria: Official API client implementing `GET /search` and `GET /v2/insights` against `https://hackathon.api.qloo.com` with `X-Api-Key` headers.
  - Verification Evidence: Verified via 23 automated tests in `tests/qlooClient.test.js`, including upstream mock responses, HTTP 429 rate limit backoff, HTTP 401 secret redaction, and 404 empty result handling.
- [x] **Task 2.2: Authentic Schema Demo Fixture Fallback**
  - Priority: P1 (High)
  - Status: DONE
  - Acceptance Criteria: Deterministic offline mode using authentic Qloo schemas when `QLOO_API_KEY` is not set; clearly labelled `sourceMode: 'demo_fixture'`.
  - Verification Evidence: Verified in `tests/qlooClient.test.js` (`sourceMode: 'demo_fixture'`). Never represents mock data as live inference.
- [x] **Task 2.3: Supported Entity Types & Official Schema Alignment**
  - Priority: P1 (High)
  - Status: DONE
  - Acceptance Criteria: Strictly validate `filter.type` against documented list (`urn:entity:artist`, `urn:entity:place`, etc.), correcting common pitfalls, and using `signal.interests.entities` for insight signals.
  - Verification Evidence: Tested in `tests/qlooClient.test.js` (`validateEntityType` and upstream schema parser).
- [x] **Task 2.4: Traceable Personalization Evidence Strip**
  - Priority: P1 (High)
  - Status: DONE
  - Acceptance Criteria: Every recommendation links directly to the seed entity URN and cultural affinity score.
  - Verification Evidence: Rendered in React `TasteCard.jsx` and verified in `tests/tasteAgent.test.js`.

---

## Priority 3: Resilience, State & Conversational Refinement
- [x] **Task 3.1: Conversational Refinement Engine**
  - Priority: P1 (High)
  - Status: DONE
  - Acceptance Criteria: Real-time re-ranking for "Make it cheaper", "More art", "Skip food", and "More relaxed".
  - Verification Evidence: Tested via `tests/tasteAgent.test.js` and `POST /api/refine` in `tests/apiRoutes.test.js`.
- [x] **Task 3.2: Side-by-Side Generic Baseline Comparison**
  - Priority: P1 (High)
  - Status: DONE
  - Acceptance Criteria: Direct comparison showing Qloo affinity recommendations vs generic popularity heuristic.
  - Verification Evidence: Verified in `tests/apiRoutes.test.js` (`POST /api/compare`).
- [x] **Task 3.3: Saved Discoveries Drawer**
  - Priority: P2 (Medium)
  - Status: DONE
  - Acceptance Criteria: LocalStorage persistence with bookmark toggling and 1-click JSON export.
  - Verification Evidence: Tested and rendered in `public/js/app.js`.

---

## Priority 4: Visual Polish & Micro-Animations
- [x] **Task 4.1: UI Styling & Editorial Travel Design System**
  - Priority: P2 (Medium)
  - Status: DONE
  - Acceptance Criteria: Dark midnight foundation, glassmorphic panels, Google Fonts typography (Outfit & Inter), responsive layouts.
  - Verification Evidence: Styled in `client/src/index.css` and `public/css/style.css` with responsive mobile/desktop breakpoints.
- [x] **Task 4.2: React SPA Client Architecture**
  - Priority: P1 (High)
  - Status: DONE
  - Acceptance Criteria: React 18 + Vite SPA with `Discover`, `PlanExperience`, `MyTaste`, and `Saved` pages, global `TasteContext`, API services, and `ComparisonModal`.
  - Verification Evidence: `npm --prefix client run build` built `dist/` cleanly in 309ms; served by Express server.

---

## Priority 5: Verification, Deployment & Submission Package
- [x] **Task 5.1: Automated Test Suite (23 Tests)**
  - Priority: P0 (Blocker)
  - Status: DONE
  - Acceptance Criteria: Static checks, unit tests, integration tests, and smoke tests all pass.
  - Verification Evidence: `npm test` exited code 0 (23/23 passing in 150ms).
- [x] **Task 5.2: 7-Layer Audit Verification**
  - Priority: P0 (Blocker)
  - Status: DONE
  - Acceptance Criteria: Automated project audit completes with 7/7 layers passing and zero errors.
  - Verification Evidence: `./scripts/project-audit hackathons/tastetrail-ai` passed 7/7 layers (Static, Unit, Integration, Smoke, User Journey, Build, Security).
- [x] **Task 5.3: Deployment Configurations & Submission Package**
  - Priority: P1 (High)
  - Status: DONE
  - Acceptance Criteria: `render.yaml`, `vercel.json`, `DEMO-SCRIPT.md`, and `SUBMISSION-CHECKLIST.md` complete.
  - Verification Evidence: Created and verified in project root.
