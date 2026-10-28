# AGENTS.md — TasteTrail AI Autonomous Engineering Rules

## 1. Scope & Isolation
You are working exclusively within this isolated hackathon project:
- **Project Name**: TasteTrail AI
- **Directory**: `hackathons/tastetrail-ai/`
- Never modify files in other hackathon projects or outside this directory unless specifically instructed.

---

## 2. Core Operational Principles
1. **Vertical Slice First**: Implement the simplest working end-to-end user journey before adding secondary features.
2. **Empirical Verification**: Never mark a task `DONE` without executing the relevant tests, lint checks, or build commands.
3. **No Mock Disguises**: Never represent mock responses as live AI model inference. Clearly label any unverified external APIs.
4. **Autonomous Progression**: Maintain `TASKS.md` and `PROGRESS.md`. Move immediately from one task to the next without waiting for routine confirmation.
5. **Clean Secrets**: All secrets reside in `.env` (ignored by Git). Never hardcode secrets in source files or frontend bundles.

---

## 3. The 7 Verification Layers for TasteTrail AI
Before marking the project `SUBMISSION READY`, verify:
1. `npm run lint` or `python -m ruff check .` (Static Checks)
2. `npm run typecheck` or `python -m mypy` (Type Safety)
3. `npm test` or `pytest` (Unit & Integration Tests)
4. Application launch and `/api/health` response (Smoke Test)
5. Primary user journey exercise (End-to-End Test)
6. `npm run build` or production package build (Production Build)
7. Hardcoded secret scan and `.env` leakage check (Security Review)
