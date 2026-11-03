# Counterpoint — Decision Lab

Counterpoint is an evidence-led decision workspace. It helps you compare options, challenge assumptions, and record what happened after you decide.

## What it does

For each decision, Counterpoint:

1. Frames the question and identifies assumptions.
2. Researches the topic using current web sources.
3. Builds the strongest fair case for and against each path.
4. Runs a red-team review to find blind spots.
5. Scores options against your chosen criteria.
6. Produces a recommendation with confidence and change triggers.

You can compare two to five options, define weighted criteria, add personal context, attach one JPG/PNG/WebP image for visual analysis, test alternative scenarios, and record the eventual outcome. Saved decisions can be reviewed later for patterns.

The workflow is a fixed sequence of role-based model calls, not an autonomous agent. Generated scores, recommendations, and summaries are model judgments; search results are retrieved evidence and are not independently verified. Review source links and verify important facts before taking consequential action.

## Stack

- **Frontend:** TypeScript, Vite, and CSS
- **API:** FastAPI and Uvicorn
- **Storage:** SQLite with a persistent Render disk in production
- **AI and search:** Groq, Google Gemini, and Tavily
- **Deployment:** Vercel for the frontend and Render for the API

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
