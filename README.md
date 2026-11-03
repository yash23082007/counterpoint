# Counterpoint — Evidence-Led Decision Intelligence

> A full-stack AI decision workspace that turns an ambiguous choice into a structured, evidence-backed decision brief.

Counterpoint helps people compare options, challenge assumptions, and learn from outcomes. It combines live web research, opposing arguments, red-team analysis, weighted criteria, scenario testing, and outcome tracking in one workflow.

## Resume-ready project description

**Counterpoint | AI Decision Intelligence Platform**
*TypeScript, Vite, FastAPI, Python, SQLite, Groq, Google Gemini, Tavily, Vercel, Render*

- Built a full-stack **multi-agent and multimodal AI decision-support platform** that converts ambiguous choices into structured, evidence-backed decision briefs through framing, web research, opposing arguments, red-team analysis, weighted scoring, and recommendation stages.
- Developed a FastAPI backend with Pydantic validation, asynchronous provider integrations, SQLite persistence, indexed decision history, health checks, API contract versioning, and provider-mocked workflow testing.
- Implemented secure email/password authentication using scrypt password hashing, hashed expiring session tokens, HTTP-only cookie sessions, account-scoped data access, logout, and authentication rate limiting.
- Designed a decision scorecard supporting **2–5 options**, user-defined criteria and weights, source-linked reasoning, confidence estimates, scenario reassessment, image evidence through vision-model analysis, outcome tracking, and learning reviews.
- Deployed the frontend on Vercel and the API on Render with persistent SQLite storage; achieved a **537 ms production frontend build**, **45.3 KB JavaScript bundle**, and **1 passing backend smoke test in 0.384 s** in local validation.

### ATS keywords

Artificial Intelligence (AI), Generative AI, Multi-Agent AI, Multimodal AI, LLM applications, AI agents, agentic workflows, prompt engineering, vision models, decision support systems, full-stack development, TypeScript, JavaScript, Python, FastAPI, REST API, Pydantic, SQLite, asynchronous programming, HTTPX, Vite, HTML, CSS, authentication, session management, password hashing, rate limiting, API integration, web search, data validation, test automation, unit testing, Vercel, Render, cloud deployment.

## Why this project stands out

This is more than a chat interface. Counterpoint demonstrates how to build a reliable AI product around a repeatable workflow:

- **Structured reasoning:** A fixed sequence of specialist roles produces a reviewable analysis instead of an opaque single response.
- **Evidence awareness:** Search results are linked to claims and presented as provenance, not as automatically verified truth.
- **Decision-quality UX:** Users can define options, priorities, constraints, and the evidence that would change their mind.
- **Personalized evaluation:** Each option is scored against user-defined criteria and weights before the final recommendation.
- **Closed-loop learning:** Users can record outcomes and request a review of patterns across past decisions.
- **Production-minded engineering:** Authentication, password hashing, session expiry, rate limits, validation, persistent storage, health checks, and deployment configuration are included.

## Product workflow

For each decision, Counterpoint:

1. **Frames** the question and identifies assumptions and research angles.
2. **Researches** the topic using current web sources.
3. **Advocates** for and against each path using the available evidence.
4. **Red-teams** the analysis to surface blind spots and weak assumptions.
5. **Evaluates** options against weighted user criteria.
6. **Judges** the trade-offs and produces a recommendation, confidence estimate, and change triggers.
7. **Learns** from the eventual outcome when the user reports what happened.

Users can compare two to five options, add personal context, define weighted criteria, attach one JPG/PNG/WebP image for visual analysis, test alternate scenarios, and save decision history.

## Technical architecture

```text
Browser (TypeScript + Vite)
        │
        │  /api requests, cookie-based session
        ▼
FastAPI service (Python)
        ├── Authentication and rate limiting
        ├── Decision workflow orchestration
        ├── Provider adapters and response validation
        └── SQLite persistence
                │
                ├── Groq — reasoning roles
                ├── Google Gemini — visual analysis and learning review
                └── Tavily — current web research
```

### Technology choices

- **Frontend:** TypeScript, Vite, and CSS
- **Backend:** FastAPI, Uvicorn, Pydantic, and HTTPX
- **Database:** SQLite with WAL mode and indexed user decision history
- **Authentication:** Scrypt password hashing and hashed, expiring session tokens
- **Deployment:** Vercel for the frontend and Render for the API

## Engineering highlights

- Role-based AI workflow with parallelizable analysis stages and explicit uncertainty handling.
- Option-by-criterion scorecard that distinguishes unavailable evaluator output from a real zero score.
- Provider timeouts, fallback handling, structured response parsing, and source provenance.
- Secure-by-default session design: cookies, server-side token hashes, expiry, logout, and account-scoped queries.
- Per-user model usage limits and authentication attempt limits to control cost and abuse.
- Persistent SQLite deployment with health and contract-version endpoints for frontend/backend compatibility checks.
- Provider-mocked workflow smoke tests that run without making live AI or search requests.

## Performance and quality metrics

The following figures were measured locally from the current repository. Build and bundle figures are machine-dependent; provider latency varies with network conditions, model selection, and third-party rate limits.

| Metric | Current figure | How it was measured |
|---|---:|---|
| Production frontend build | 6.64 s | `npm run build` |
| JavaScript bundle | 45.3 KB | Vite production output, before compression |
| CSS bundle | 41.9 KB | Vite production output, before compression |
| Total generated `dist/` output | 104.3 KB | Five production files, before compression |
| Backend workflow smoke test | 1 test passed in 2.01 s | Provider-mocked `unittest` test body |
| Full test command | 6.60 s | `python -m unittest discover ...` |
| SQLite connection timeout | 10 s | Backend database configuration |
| Provider request timeout | 90 s | Backend HTTP client configuration |

### Input, capacity, and reliability figures

- **2–5** user-defined options per decision.
- **5 MB** maximum decoded image size.
- **30** saved outcomes included in one learning review.
- **6** full analyses per account per hour.
- **20** scenario reassessments per account per hour.
- **4** learning reviews per account per day.
- Scorecard values use a **0–5** fit scale and include every option/criterion pair when provider output is valid.

### Accuracy and latency status

AI recommendation accuracy is intentionally **not claimed yet**. The project currently treats scores and recommendations as model estimates, not ground truth. A meaningful accuracy metric requires a labeled evaluation set with known decision outcomes and a defined scoring rubric.

End-to-end analysis latency is also **not represented by the local build/test timings**. A production benchmark should report p50, p95, and p99 latency separately for health checks, saved-decision reads, full analyses, and scenario reassessments, with provider/model versions and network region recorded.

Recommended next measurement milestone:

1. Create a versioned set of representative decisions with human-reviewed expected outputs.
2. Score citation validity, option coverage, criterion coverage, unsupported-claim rate, and recommendation usefulness.
3. Run at least 30 authenticated analyses against staging and report p50/p95 latency, error rate, timeout rate, and provider cost per analysis.

## Requirements

- Node.js 20.19 or newer
- Python 3.10 or newer
- API keys for [Groq](https://console.groq.com/keys), [Google AI Studio](https://aistudio.google.com/app/apikey), and [Tavily](https://app.tavily.com/home)

## Run locally

### 1. Configure the API

From the project root, copy `backend/.env.example` to `backend/.env` and add your provider keys:

```env
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_google_ai_studio_api_key
TAVILY_API_KEY=your_tavily_api_key
```

The `.env` file is ignored by Git. Provider keys remain on the backend and are not exposed to the browser.

### 2. Start the backend

In PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Start the frontend

In a second terminal, from the project root:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. During development, Vite proxies `/api` requests to `http://127.0.0.1:8000`.

## Deploy

### Frontend — Vercel

The Vercel configuration builds the Vite app with:

```text
npm run build
```

`vercel.json` rewrites `/api/*` to the deployed Render API. Update the destination if the API URL changes.

### API — Render

`render.yaml` defines the API service. Configure these secrets in Render:

```text
GROQ_API_KEY
GEMINI_API_KEY
TAVILY_API_KEY
```

The blueprint sets `DATABASE_PATH=/var/data/counterpoint.db` and `COOKIE_SECURE=true`, and mounts a persistent disk for SQLite. Keep that disk private and back it up securely because it contains account emails, decision context, generated analyses, and outcome notes.

SQLite is intended for this single-service deployment. Use a shared managed database before scaling the API to multiple instances. After deployment, verify `/api/health`, `/api/version`, and a signed-in analysis request.

## Usage limits

To control provider spend, each signed-in account is limited to:

- Six full decision analyses per hour
- Twenty scenario reassessments per hour
- Four learning reviews per day

Authentication endpoints also enforce per-IP attempt limits. Full analyses make several provider calls and one web search; adding an image makes an additional Gemini call. Scenario reassessments reuse saved evidence and do not perform a new web search.

## API overview

- `GET /api/health` — database readiness and provider-key status
- `GET /api/version` — API contract and supported option range
- `POST /api/auth/signup` — create an account
- `POST /api/auth/login` — start an email/password session
- `POST /api/auth/logout` — end the current session
- `GET /api/auth/me` — get the current signed-in user
- `POST /api/debate` — create and save a decision analysis
- `GET /api/decisions` — list the signed-in user's decisions
- `DELETE /api/decisions` — clear saved decisions
- `PATCH /api/decisions/{id}/outcome` — record the decision outcome and ratings
- `POST /api/decisions/{id}/scenario` — reassess a saved decision with new weights
- `POST /api/decisions/learning-review` — review up to 30 reported outcomes

`POST /api/debate` accepts `topic`, `criteria`, optional `options`, `mind_changer`, `context`, and `weights`. Options must contain two to five paths. An optional image can be sent as base64 using `image_data`, `image_mime`, and `image_name`; supported types are JPEG, PNG, and WebP, with a decoded size limit of 5 MB.

## Data and privacy

- The topic and criteria are sent to Tavily for search and to AI providers for analysis.
- Options and personal context are sent to AI providers; personal context is not included in the Tavily query.
- Attached image bytes are sent to Gemini for analysis and are not saved. The filename and generated observations are saved with the decision.
- Decision details, generated analysis, outcome notes, and feedback ratings are saved in the application database.
- A learning review sends up to 30 saved decisions, outcome notes, and ratings to Gemini when requested.
- Use **Clear history** in the app to delete saved decisions.

Do not submit information you are not comfortable sending to these providers or storing in your account. Provider data handling is subject to the policies and settings of Groq, Google Gemini, and Tavily.

## Project structure

```text
.
├── backend/
│   ├── main.py                 # FastAPI application and SQLite access
│   ├── requirements.txt        # Python dependencies
│   └── test_workflow_smoke.py  # Provider-mocked workflow test
├── public/                     # Static assets
├── src/
│   ├── main.ts                 # Frontend UI and API integration
│   └── style.css               # Application styles
├── index.html
├── render.yaml                 # Render API service
└── vercel.json                 # Vercel frontend and API rewrite
```

## Local checks

```powershell
npm run build
python -m py_compile backend/main.py
python -m unittest discover -s backend -p "test_*.py" -v
```

## Current limitations

- There is no email verification, password reset, or account deletion flow.
- Google sign-in is not available. Existing Google-only accounts have no password credential and cannot sign in; their stored records are preserved.
- Outcome reviews use user-reported notes and ratings and are not independently verified.
- Criterion scores and confidence are model estimates and are not calibrated against real-world outcomes.
- Test the Vercel/Render path with production credentials before inviting public users.
