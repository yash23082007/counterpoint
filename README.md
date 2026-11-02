# Counterpoint — Decision Lab

Counterpoint helps people examine a consequential choice before acting. It combines current web sources, user priorities, opposing arguments, a red-team challenge, and a final recommendation in a saved decision brief.

## The decision workflow

Counterpoint runs a fixed role-based sequence of model calls. Some roles run in parallel. This is a structured analysis pipeline, not an autonomous agent: roles do not plan tasks, use operational tools, or take actions. The brief exposes role inputs, generated contributions, retrieved sources, and uncertainty so a person can review the reasoning. A person remains responsible for verifying important facts and for any consequential action.


1. **Framer** identifies assumptions, missing information, and research angles.
2. **Researcher** checks the relevance and limitations of search results.
3. **Advocates** make the strongest fair case for and against the decision.
4. **Red team** looks for blind spots and evidence that may not apply.
5. **Criteria evaluator** returns a confidence estimate, rough fit scores, and facts that could change the recommendation.
6. **Judge** weighs all of the above and writes the recommendation.

Search results are retrieved evidence, not independently verified sources. User-provided details are treated as given; generated judgments are inferences, and missing information is surfaced as assumptions or unknowns. Users can compare two to five options, attach one JPG/PNG/WebP image for visual analysis, set criterion priorities, stress-test alternate priorities or assumptions, record an outcome, and request a review of patterns across past decisions. The scorecard compares each listed option against each criterion before the judge synthesizes a recommendation. Scores are model judgments, not calibrated measurements. Search snippets and AI analysis can be wrong; follow source links and verify important facts.

## Data and privacy

- The decision topic and criteria are sent to Tavily for search and to the AI providers for analysis. Options and personal context are sent to AI providers; personal context is not included in the Tavily query.
- An attached image is sent to Gemini for visual analysis. The application does not save the image bytes; it saves the filename and generated observations with the decision.
- Decision details, generated analysis, outcome notes, and feedback ratings are saved in the application database. The learning review sends up to 30 saved decisions with their outcome notes and ratings to Gemini when the user requests that review.
- Use the in-app **Clear history** action to delete saved decisions. Account deletion and password reset are not currently available. Do not submit information you are not comfortable sending to these providers or storing in this account.
- Provider data handling is subject to the policies and settings of Groq, Google Gemini, and Tavily.

## Requirements

- Node.js 20.19+ (Vite 8)
- Python 3.10+
- API keys for [Groq](https://console.groq.com/keys), [Google AI Studio](https://aistudio.google.com/app/apikey), and [Tavily](https://app.tavily.com/home)

## Run locally

### 1. Configure provider keys

Create `backend/.env` from `backend/.env.example`:

```env
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_google_ai_studio_api_key
TAVILY_API_KEY=your_tavily_api_key
```

The `.env` file is ignored by Git; provider keys stay on the backend. Accounts use email and password.

### 2. Start the API

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Start the frontend

In a second terminal from the project root:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. The dev server proxies `/api` to `127.0.0.1:8000`.

## Deploy

The frontend is configured for Vercel. `vercel.json` rewrites `/api/*` to the Render API URL currently set in that file. Confirm that destination matches the public URL of the Render service before deploying.

The Render service is defined in `render.yaml` and uses a persistent disk for SQLite. Configure these secrets on Render:

```text
GROQ_API_KEY
GEMINI_API_KEY
TAVILY_API_KEY
```

The blueprint sets `COOKIE_SECURE=true` and `DATABASE_PATH=/var/data/counterpoint.db`. Keep the persistent disk private and back it up securely; it contains account email addresses, personal decision context, and saved analyses. SQLite is intended for this single-service deployment; use a shared managed database before scaling the API to multiple instances.

## Usage limits

To control model-provider spend, each signed-in account is limited to six full decision analyses per hour, twenty scenario reassessments per hour, and four learning reviews per day. Authentication endpoints also have per-IP attempt limits. Forwarded IP headers are ignored unless the direct peer matches an explicitly configured `TRUSTED_PROXY_CIDRS` network. Configure only proxy ranges you control; otherwise the direct connection peer address is used. The limits are enforced by SQLite and apply per application instance.

Each full analysis makes several model-provider calls plus a web search. The search query uses only the trimmed decision topic and criteria; framer output and personal context are not sent to Tavily. An image adds a Gemini call. The progress trail shows the fixed workflow, not live per-role completion events. Long response times are possible; scenario reruns reuse saved evidence and do not perform a new web search.

## Local checks

- `npm run build` checks TypeScript and creates the production bundle.
- `python -m py_compile backend/main.py` checks backend syntax.
- `python -m unittest discover -s backend -p "test_*.py" -v` runs the provider-mocked workflow smoke test.

## API overview

- `GET /api/health` reports database readiness and whether provider keys are configured; it does not make live calls to provider services.
- `GET /api/version` reports the deployed API contract and supported option range so the frontend can detect stale deployments.
- `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/me` manage email/password sessions.
- `POST /api/debate` creates and saves a decision analysis.
- `GET /api/decisions` lists the signed-in user's decisions; `DELETE /api/decisions` clears them.
- `PATCH /api/decisions/{id}/outcome` records a choice, follow-up notes, usefulness rating, and source-trust rating.
- `POST /api/decisions/{id}/scenario` reassesses a saved decision under new criterion weights and an optional assumption.
- `POST /api/decisions/learning-review` reviews up to 30 reported outcomes for that account.

`POST /api/debate` accepts JSON fields `topic`, `criteria`, optional `options` (two to five; without them, broad proceed/do-not-proceed paths are inferred), `mind_changer`, `context`, and `weights`. The response includes an option-by-criterion comparison; missing evaluator rows are returned as unavailable instead of being treated as zero. Sources may include a provider-reported publication date, which is displayed as provenance rather than treated as verification. An optional image can be sent as base64 in `image_data` with `image_mime` and `image_name`; supported MIME types are JPEG, PNG, and WebP, up to 5 MB decoded size.

## Current limitations

- There is no email verification, password reset, or account deletion flow. Google sign-in has been removed. Existing Google-only accounts have no password credential and cannot sign in; their stored records are preserved.
- Outcome reviews are based on user-reported notes and ratings; they are not independently verified or a cross-user learning system.
- Criterion scores and confidence are model estimates and have not been calibrated against real-world decision outcomes.
- Provider integrations and the deployed Vercel/Render path should be exercised with production credentials before inviting public users.
