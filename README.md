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

The root `vercel.json` defines two Vercel services:

- `app` builds the Vite frontend and the Node API bridge. It receives public `/` and `/api/*` requests.
- `counterpoint-api` runs FastAPI. It stays internal; only the `app` service can call it through the `COUNTERPOINT_API_URL` service binding.

Vercel services are in beta. Import this repository into a Vercel project with the project root at the repository root and the framework set to **Services** (or let Vercel detect the `services` configuration). The API bridge forwards browser `/api/*` requests to FastAPI at the same path, so the existing frontend URLs and FastAPI `/api/...` routes remain aligned. The binding is resolved at runtime inside the Node function, not during the Vite build.

Set these project environment variables in Vercel for the environments you deploy:

```text
GROQ_API_KEY
GEMINI_API_KEY
TAVILY_API_KEY
GOOGLE_CLIENT_ID
```

Do not create a `COUNTERPOINT_API_URL` variable yourself; Vercel injects it from the binding. The API bridge runs for up to 300 seconds to cover model-provider requests. For local multi-service development, install or run the Vercel CLI and use `vercel dev` from the repository root; the ordinary Vite dev command still proxies to local FastAPI on port 8000.

### Database requirement before production

The current backend stores accounts, sessions, and decisions in a local SQLite file. Vercel Functions have a read-only filesystem apart from temporary `/tmp` storage, and function instances do not share a permanent SQLite file. A Vercel deployment therefore needs a shared persistent database (for example, PostgreSQL) before real users create accounts or save decisions. Do not point `DATABASE_PATH` at `/tmp` for production data. The current `render.yaml` remains available for the separate Render deployment, which uses a persistent disk for SQLite.

### Google sign-in

In Google Auth Platform, add the Vercel production domain as an **Authorized JavaScript origin**, such as `https://your-project.vercel.app` (no path or trailing slash), and add your Google account under **Audience → Test users** while the consent screen is in testing. Add a custom production domain separately. Google Identity Services verifies ID tokens through `GOOGLE_CLIENT_ID`; the app does not need the OAuth client secret.

## Optional model settings

Set `GROQ_MODEL` or `GEMINI_MODEL` in `backend/.env` to override the defaults (`openai/gpt-oss-120b` and `gemini-2.5-flash`). The chosen model must be available to your provider account.

## API

- `GET /api/health` reports backend status and whether provider keys are configured.
- `POST /api/auth/signup` and `POST /api/auth/login` create accounts and start sessions; `POST /api/auth/logout` ends a session; `GET /api/auth/me` returns the signed-in account.
- `POST /api/debate` requires a session, accepts a decision topic and criteria, returns `for`, `against`, `verdict`, and cited `sources`, and saves the decision to the signed-in account.
- `GET /api/decisions` returns the signed-in account's history. `DELETE /api/decisions` clears it.
