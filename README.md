# Counterpoint — The Debate-to-Decision Engine

Counterpoint helps you examine a difficult choice from multiple angles. Tavily finds relevant web sources, two Groq-powered advocates make the strongest fair case for and against a decision, and Gemini weighs both cases against your criteria.

## How it works

1. Describe a decision and select the criteria that matter to you.
2. Tavily searches the web and provides source links to both Groq advocates.
3. Groq generates the pro and con arguments in parallel, citing supplied sources where relevant.
4. Gemini compares those arguments with your criteria and writes a recommendation, uncertainties, and next step.
5. Sign in to revisit decisions saved to your account in SQLite.

Model responses can be mistaken and search snippets can lack context; open and verify important sources independently.

## Requirements

- Node.js 20.19+ (Vite 8)
- Python 3.10+
- API keys for [Groq](https://console.groq.com/keys), [Google AI Studio](https://aistudio.google.com/app/apikey), and [Tavily](https://app.tavily.com/home)

Password-created accounts are local to this deployment. There is no password reset flow yet, so use an email address you can identify and a unique password. Google sign-in creates or returns an account using the verified Google identity.

## Run locally

### 1. Configure provider keys

Create `backend/.env` using `backend/.env.example` as a guide:

```env
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_google_ai_studio_api_key
TAVILY_API_KEY=your_tavily_api_key
GOOGLE_CLIENT_ID=your_google_oauth_web_client_id.apps.googleusercontent.com
```

To enable **Continue with Google**, create a Web application OAuth client in Google Cloud Console and add `http://127.0.0.1:5173` as an authorized JavaScript origin. Put its client ID in `GOOGLE_CLIENT_ID`, then restart the backend. Google ID tokens are verified server-side before a session is created.

The local `.env` is ignored by Git. Keys stay in the Python backend and are never sent to the browser.
Passwords are salted and hashed with scrypt. Sessions use random server-side tokens stored as hashes and an HTTP-only, SameSite=Strict cookie. SQLite stores accounts and decisions in `backend/counterpoint.db`, which is also ignored by Git.

### 2. Start the backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Start the web app

In a second terminal from the project root:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. Its development server forwards `/api` requests to the backend on port 8000.

On an HTTPS deployment, set `COOKIE_SECURE=true` and configure a persistent private volume for `DATABASE_PATH`. The default cookie setting is for local HTTP development. Back up the SQLite database securely; it contains account emails and saved decision content.

## Deploy to Vercel with multiple services

The root `vercel.json` defines the Vercel frontend service:

- `app` builds and serves the Vite frontend at `/`.

The `/api/*` rewrite forwards same-origin browser requests to the Render FastAPI service at `https://counterpoint-api-q1yx.onrender.com`. This keeps browser requests on the Vercel domain while using Render's persistent disk for account and decision data. No Vercel service binding is needed because the app does not call another Vercel service.

Set these environment variables on the Render API service:

```text
GROQ_API_KEY
GEMINI_API_KEY
TAVILY_API_KEY
GOOGLE_CLIENT_ID
```

For local development, the ordinary Vite dev command proxies `/api` to FastAPI on port 8000. The Vercel multi-service setup uses same-origin rewrites for production.

### Database storage

The Render deployment in `render.yaml` stores accounts, sessions, and decisions in SQLite on a persistent disk. The Vercel frontend uses that Render API. If FastAPI is moved back to Vercel, replace SQLite with a shared persistent database first; Vercel function filesystems are not durable or shared.

### Google sign-in

In Google Auth Platform, add the Vercel production domain as an **Authorized JavaScript origin**, such as `https://your-project.vercel.app` (no path or trailing slash), and add your Google account under **Audience → Test users** while the consent screen is in testing. Add a custom production domain separately. Google Identity Services verifies ID tokens through `GOOGLE_CLIENT_ID`; the app does not need the OAuth client secret.

## Optional model settings

Set `GROQ_MODEL` or `GEMINI_MODEL` in `backend/.env` to override the defaults (`openai/gpt-oss-120b` and `gemini-2.5-flash`). The chosen model must be available to your provider account.

## API

- `GET /api/health` reports backend status and whether provider keys are configured.
- `POST /api/auth/signup` and `POST /api/auth/login` create accounts and start sessions; `POST /api/auth/logout` ends a session; `GET /api/auth/me` returns the signed-in account.
- `POST /api/debate` requires a session, accepts a decision topic and criteria, returns `for`, `against`, `verdict`, and cited `sources`, and saves the decision to the signed-in account.
- `GET /api/decisions` returns the signed-in account's history. `DELETE /api/decisions` clears it.
