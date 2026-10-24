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

## Deploy to Render and Vercel

The repository includes a Render Blueprint (`render.yaml`), a Vercel build config (`vercel.json`), and a Vercel API proxy (`api/[...path].js`). The proxy keeps browser requests and secure session cookies on the Vercel origin while forwarding API calls to Render. This avoids cross-origin cookie and CORS configuration.

### 1. Deploy the API to Render

1. Push this repository to GitHub and create a new **Blueprint** in Render from that repository.
2. Generate a private proxy token (for example, run `python -c "import secrets; print(secrets.token_urlsafe(48))"`) and keep it available while configuring both services.
3. Render reads `render.yaml` and creates the `counterpoint-api` service. The Blueprint requests these secret values during setup: `GROQ_API_KEY`, `GEMINI_API_KEY`, `TAVILY_API_KEY`, `GOOGLE_CLIENT_ID`, and `BACKEND_PROXY_TOKEN`. Enter the generated proxy token for `BACKEND_PROXY_TOKEN`.
4. The service mounts a persistent disk at `/var/data` for the SQLite database. The Blueprint uses Render's Starter instance because SQLite data must persist across deploys and restarts; Render persistent disks require a paid service plan.
5. Wait until the service is live and its `/api/health` check passes. Copy its base URL, for example `https://counterpoint-api.onrender.com`.

### 2. Deploy the web app to Vercel

1. Import the same GitHub repository into Vercel. Keep the project root set to the repository root.
2. Vercel uses `npm run build` and the `dist` output from `vercel.json`. The `api` directory is deployed as a Vercel Node function.
3. In the Vercel project's **Settings → Environment Variables**, add `BACKEND_URL` with the Render service base URL (no trailing slash), for example `https://counterpoint-api.onrender.com`, and `BACKEND_PROXY_TOKEN` with the exact same private token entered in Render.
4. Redeploy after setting the variables. Open the Vercel site and check that its `/api/health` endpoint returns `{"status":"ok", ...}`. Other API routes require the private proxy token, so the public Render URL cannot be used to bypass the Vercel app.

### 3. Enable Google sign-in on the deployed site

In Google Auth Platform, edit the same Web OAuth client and add the Vercel production domain as an **Authorized JavaScript origin**, such as `https://your-project.vercel.app` (no path or trailing slash). Add any custom production domain too. Add your Google account under **Audience → Test users** while the app is in testing. Google sign-in on preview deployment domains requires each preview origin to be authorized separately; use the production URL for testing if previews are not registered.

Google Identity Services verifies ID tokens through `GOOGLE_CLIENT_ID`; this app does not need the OAuth client secret. If a client secret was exposed, rotate it in Google Cloud and do not add it to Vercel or Render.

### Production notes

- Keep provider keys and `GOOGLE_CLIENT_ID` in Render's environment settings. Never use a `VITE_` prefix for secrets.
- The Vercel proxy passes API cookies through to the browser, so authentication and saved decisions remain scoped to the Vercel site.
- The API proxy function allows up to 300 seconds for model requests. Vercel Fluid Compute must be enabled (it is enabled by default) to use the Hobby plan's 300-second function limit.
- Back up the Render disk's SQLite database before deleting or recreating the disk. Deleting the disk deletes account and decision data.
- The Render health endpoint reports API status and whether model provider keys are present; it does not call the providers or consume API credits.

## Optional model settings

Set `GROQ_MODEL` or `GEMINI_MODEL` in `backend/.env` to override the defaults (`openai/gpt-oss-120b` and `gemini-2.5-flash`). The chosen model must be available to your provider account.

## API

- `GET /api/health` reports backend status and whether provider keys are configured.
- `POST /api/auth/signup` and `POST /api/auth/login` create accounts and start sessions; `POST /api/auth/logout` ends a session; `GET /api/auth/me` returns the signed-in account.
- `POST /api/debate` requires a session, accepts a decision topic and criteria, returns `for`, `against`, `verdict`, and cited `sources`, and saves the decision to the signed-in account.
- `GET /api/decisions` returns the signed-in account's history. `DELETE /api/decisions` clears it.
