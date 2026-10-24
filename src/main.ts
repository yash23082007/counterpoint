import "./style.css";

type DebateResult = {
  id?: number;
  created_at?: number;
  topic: string;
  criteria: string[];
  options?: string[];
  mind_changer?: string;
  for: string;
  against: string;
  verdict: string;
  sources?: { title: string; url: string; content: string }[];
};

const app = document.querySelector<HTMLDivElement>("#app")!;
const starterCriteria = [
  "Financial impact",
  "Career growth",
  "Lifestyle fit",
  "Risk and uncertainty",
];
let criteria = [...starterCriteria];
let history: DebateResult[] = [];
type GoogleCredential = { credential: string };
type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        nonce: string;
        callback: (response: GoogleCredential) => void;
      }) => void;
      renderButton: (
        element: HTMLElement,
        options: {
          theme: "outline";
          size: "large";
          text: "continue_with";
          shape: "rectangular";
          width: number;
        },
      ) => void;
    };
  };
};
let googleIdentity: GoogleIdentity | undefined;

app.innerHTML = `
  <section class="auth-view" id="auth-view">
    <div class="auth-panel">
      <button type="button" class="theme-toggle auth-theme-toggle" aria-label="Switch to light theme" title="Switch to light theme">☼ Light</button>
      <div class="brand auth-brand"><span class="brand-mark">↗</span><span>Counterpoint</span></div>
      <div class="eyebrow"><span class="pulse"></span> YOUR DECISION WORKSPACE</div>
      <h1 id="auth-title">Welcome back.</h1>
      <p class="auth-intro" id="auth-intro">Sign in to continue to your saved decisions.</p>
      <div class="auth-tabs" role="tablist" aria-label="Account access">
        <button type="button" role="tab" data-auth-mode="login" aria-selected="true">Sign in</button>
        <button type="button" role="tab" data-auth-mode="signup" aria-selected="false">Create account</button>
      </div>
      <form id="auth-form">
        <label for="auth-email">Email address</label>
        <input id="auth-email" name="email" type="email" autocomplete="email" required maxlength="254" placeholder="you@example.com">
        <label for="auth-password">Password</label>
        <div class="auth-input-wrap"><input id="auth-password" name="password" type="password" autocomplete="current-password" required minlength="1" maxlength="128" placeholder="Your password"><button type="button" id="toggle-password" class="password-toggle" aria-label="Show password">Show</button></div>
        <div id="confirm-password-field" class="auth-conditional" hidden><label for="auth-confirm-password">Confirm password</label><div class="auth-input-wrap"><input id="auth-confirm-password" name="confirm-password" type="password" autocomplete="new-password" maxlength="128" placeholder="Enter your password again"></div></div>
        <div class="auth-error" id="auth-error" role="alert"></div>
        <button class="start-button auth-submit" type="submit"><span class="button-copy" id="auth-submit-label">Sign in</span><span class="button-arrow">→</span></button>
      </form>
      <div id="google-auth-area" class="google-auth-area" hidden>
        <div class="auth-divider"><span>or continue with</span></div>
        <div id="google-signin-button" class="google-signin-button"></div>
      </div>
      <p id="google-setup-note" class="google-setup-note" hidden>Google sign-in needs a web OAuth client ID in the backend settings.</p>
      <p class="auth-security">Your decisions stay in your private workspace. Passwords are securely hashed.</p>
    </div>
  </section>
  <div class="app-shell hidden">
    <aside class="sidebar">
      <a class="brand" href="#" aria-label="Counterpoint home"><span class="brand-mark">↗</span><span>Counterpoint</span></a>
      <div class="side-label">Workspace</div>
      <button class="nav-item active" id="new-decision"><span>✳</span> New decision <kbd>⌘ N</kbd></button>
      <button class="nav-item" id="show-history"><span>◷</span> Decision history <span class="history-count"></span></button>
      <div class="side-label criteria-label">Your criteria <button id="edit-criteria" class="tiny-button" aria-label="Edit criteria">Edit</button></div>
      <div class="criteria-list"></div>
    </aside>
    <main class="main-content">
      <header class="topbar"><div class="breadcrumb">Decisions <span>/</span> <b>New decision</b></div><div class="top-actions"><span id="user-email" class="user-email"></span><button class="text-btn" id="logout">Sign out</button><button class="text-btn" id="how-it-works">How it works <span>↗</span></button><button type="button" class="theme-toggle" aria-label="Switch to light theme" title="Switch to light theme">☼ Light</button></div></header>
      <section class="intro"><div class="eyebrow"><span class="pulse"></span> EVIDENCE-LED DECISIONS</div><h1>Think it through.<br><em>Then decide.</em></h1><p>Put a real decision on trial. Two independent advocates<br class="desktop-only"> will make the strongest case for each side.</p></section>
      <section class="decision-card" id="decision-card">
        <div class="card-heading"><div><span class="step-number">01</span><h2>What are you deciding?</h2></div></div>
        <div class="decision-prompts"><span>START WITH A COMMON CHOICE</span><div><button type="button" data-template="career">A career move</button><button type="button" data-template="home">Where to live</button><button type="button" data-template="purchase">Buy or wait</button></div></div>
        <label class="field-label" for="topic">Describe the decision you’re facing</label>
        <textarea id="topic" rows="3" maxlength="1200" placeholder="e.g. Should I leave my stable job to join an early-stage startup?"></textarea>
        <div class="input-meta"><span>Be as specific as you like. Your topic is sent to the AI and search providers to generate this analysis.</span><span id="char-count">0 / 1200</span></div>
        <div class="decision-setup">
          <div class="setup-heading"><span class="setup-index">A</span><div><strong>Name the paths you’re weighing</strong><small>Optional. Concrete choices lead to a sharper comparison.</small></div></div>
          <div class="option-fields"><input id="option-one" maxlength="100" placeholder="Option one · e.g. Buy in Jaipur"><span>OR</span><input id="option-two" maxlength="100" placeholder="Option two · e.g. Buy in Delhi"></div>
          <label class="field-label mind-label" for="mind-changer">What would change your mind?</label>
          <input id="mind-changer" maxlength="400" placeholder="e.g. A commute under 30 minutes, or a lower monthly payment">
          <p class="setup-note">Your answer helps the judge surface the assumptions that matter most.</p>
        </div>
        <div class="card-divider"></div>
        <div class="criteria-heading"><div><span class="step-number">02</span><h2>What matters most?</h2></div><span class="criteria-hint">Edit criteria in the sidebar</span></div>
        <div class="selected-criteria"></div>
        <div class="form-error" id="form-error" role="alert"></div>
        <button class="start-button" id="start-debate"><span class="button-copy">Start the debate</span><span class="button-arrow">→</span></button>
        <div class="privacy-foot">Your keys stay on the backend. Decisions are saved to your account.</div>
      </section>
      <section class="loading-card hidden" id="loading-card" aria-live="polite"><div class="loading-orbit"><span></span><span></span><span></span></div><div class="eyebrow">THE DEBATE IS IN SESSION</div><h2>Looking at both sides.</h2><p id="loading-step">The advocate for is building its case…</p><div class="loading-track"><span></span></div><div class="loading-roles"><span class="role-pill for-pill">↗ In favor</span><span class="role-pill against-pill">↙ Against</span><span class="role-pill judge-pill">✦ The judge</span></div></section>
      <section class="results hidden" id="results"></section>
      <section class="history-view hidden" id="history-view"></section>
      <footer class="page-footer"><span>COUNTERPOINT</span><span>Groq · Gemini · Tavily</span></footer>
    </main>
  </div>
  <dialog id="criteria-dialog"><form method="dialog" class="dialog-card"><button class="dialog-close" aria-label="Close">×</button><span class="eyebrow">PERSONALIZE YOUR DEBATE</span><h2>Your decision criteria</h2><p>Add what you want the judge to prioritize. One per line.</p><textarea id="criteria-input" rows="6"></textarea><div class="dialog-actions"><button class="cancel-button">Cancel</button><button class="save-button" id="save-criteria" value="save">Save criteria</button></div></form></dialog>
  <dialog id="help-dialog"><form method="dialog" class="dialog-card help-card"><button class="dialog-close" aria-label="Close">×</button><span class="eyebrow">A CLEARER WAY TO CHOOSE</span><h2>How Counterpoint works</h2><div class="help-step"><b>01</b><p><strong>Frame the decision.</strong><br>Describe the choice you’re weighing and what matters to you.</p></div><div class="help-step"><b>02</b><p><strong>Hear both cases.</strong><br>Separate AI advocates explore the strongest arguments for and against.</p></div><div class="help-step"><b>03</b><p><strong>Get a considered view.</strong><br>A second model weighs the cases against your criteria and gives a recommendation.</p></div><p class="help-note">AI analysis can be wrong and is not live web research. Verify important facts before deciding.</p><button class="save-button">Got it</button></form></dialog>
`;

const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
const setTheme = (theme: "dark" | "light") => {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("counterpoint-theme", theme);
  if (themeMeta) themeMeta.content = theme === "dark" ? "#111b1c" : "#f2f7f4";
  document.querySelectorAll<HTMLButtonElement>(".theme-toggle").forEach((button) => {
    const next = theme === "dark" ? "light" : "dark";
    button.textContent = theme === "dark" ? "☼ Light" : "☾ Dark";
    button.setAttribute("aria-label", `Switch to ${next} theme`);
    button.title = `Switch to ${next} theme`;
  });
};
const savedTheme = localStorage.getItem("counterpoint-theme");
setTheme(savedTheme === "light" ? "light" : "dark");
document.querySelectorAll<HTMLButtonElement>(".theme-toggle").forEach((button) => {
  button.addEventListener("click", () =>
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"),
  );
});

const $ = <T extends HTMLElement>(selector: string) =>
  app.querySelector<T>(selector)!;
const card = $("#decision-card");
const results = $("#results");
const loading = $("#loading-card");
const topicInput = $("#topic") as HTMLTextAreaElement;
const optionOneInput = $("#option-one") as HTMLInputElement;
const optionTwoInput = $("#option-two") as HTMLInputElement;
const mindChangerInput = $("#mind-changer") as HTMLInputElement;

function renderCriteria() {
  $(".criteria-list").innerHTML =
    criteria
      .map(
        (item, index) =>
          `<div class="criterion"><span class="dot dot-${index % 4}"></span><span>${escapeHtml(item)}</span></div>`,
      )
      .join("") || '<p class="empty-criteria">No criteria yet</p>';
  $(".selected-criteria").innerHTML =
    criteria
      .map(
        (item, index) =>
          `<span class="selected-chip"><i class="dot dot-${index % 4}"></i>${escapeHtml(item)}</span>`,
      )
      .join("") ||
    '<span class="criteria-hint">No criteria selected. Add some in the sidebar.</span>';
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
}

function formatText(text: string, sourceCount = 0) {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\u3010(\d+)(?:\u2020[^\u3011]*)?\u3011/g, "[$1]")
    .split("\n");
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const inline = (value: string) =>
    escapeHtml(value)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[(\d{1,2})\]/g, (citation, index: string) =>
        Number(index) <= sourceCount
          ? `<a class="inline-citation" href="#source-${index}">[${index}]</a>`
          : citation,
      );
  const flushParagraph = () => {
    if (paragraph.length)
      blocks.push(`<p>${paragraph.map(inline).join("<br>")}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (listType && list.length)
      blocks.push(
        `<${listType}>${list.map((item) => `<li>${inline(item)}</li>`).join("")}</${listType}>`,
      );
    list = [];
    listType = null;
  };
  const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
  const isTableDivider = (line: string) =>
    /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  const cells = (line: string) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (
      isTableRow(line) &&
      i + 1 < lines.length &&
      isTableDivider(lines[i + 1])
    ) {
      flushParagraph();
      flushList();
      const headers = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i]))
        rows.push(cells(lines[i++]));
      i--;
      blocks.push(
        `<div class="table-scroll"><table><thead><tr>${headers.map((cell) => `<th>${inline(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((header, index) => `<td data-label="${escapeHtml(header)}">${inline(row[index] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`,
      );
      continue;
    }
    const heading = line.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push(`<h4>${inline(heading[1])}</h4>`);
      continue;
    }
    const namedHeading = line
      .replace(/:$/, "")
      .match(
        /^(Bottom line|Recommendation|Key unknowns?|What could change[^:]*|Next step|Assumptions?)$/i,
      );
    if (namedHeading) {
      flushParagraph();
      flushList();
      blocks.push(`<h4>${inline(namedHeading[1])}</h4>`);
      continue;
    }
    const item =
      line.match(/^(?:[-*•]\s+)(.*)$/) ?? line.match(/^\d+[.)]\s+(.*)$/);
    if (item) {
      flushParagraph();
      const nextType = /^\d+[.)]\s+/.test(line) ? "ol" : "ul";
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      list.push(item[1]);
      continue;
    }
    flushList();
    paragraph.push(line.replace(/\s{2,}$/g, ""));
  }
  flushParagraph();
  flushList();
  return blocks.join("");
}

function updateHistoryCount() {
  $(".history-count").textContent = history.length
    ? String(history.length)
    : "";
}

let authMode: "login" | "signup" = "login";

function showAuth(mode: "login" | "signup") {
  authMode = mode;
  $("#auth-title").textContent =
    mode === "login" ? "Welcome back." : "Make room to think.";
  $("#auth-intro").textContent =
    mode === "login"
      ? "Sign in to continue to your saved decisions."
      : "Create an account to keep your decisions in one place.";
  $("#auth-submit-label").textContent =
    mode === "login" ? "Sign in" : "Create account";
  document
    .querySelectorAll<HTMLButtonElement>("[data-auth-mode]")
    .forEach((tab) => {
      const selected = tab.dataset.authMode === mode;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });
  const confirmField = $("#confirm-password-field");
  confirmField.hidden = mode !== "signup";
  const confirmPassword = $("#auth-confirm-password") as HTMLInputElement;
  confirmPassword.required = mode === "signup";
  confirmPassword.value = "";
  const passwordInput = $("#auth-password") as HTMLInputElement;
  passwordInput.type = "password";
  confirmPassword.type = "password";
  $("#toggle-password").textContent = "Show";
  $("#toggle-password").setAttribute("aria-label", "Show password");
  passwordInput.autocomplete =
    mode === "login" ? "current-password" : "new-password";
  passwordInput.minLength = mode === "login" ? 1 : 12;
  passwordInput.placeholder =
    mode === "login" ? "Your password" : "At least 12 characters";
  $("#auth-error").textContent = "";
}

async function apiRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.detail || "The request could not be completed.");
  return data as T;
}

async function configureGoogleSignIn() {
  const setupNote = $("#google-setup-note");
  try {
    const config = await apiRequest<{
      client_id: string | null;
      nonce?: string;
    }>("/api/auth/google/config");
    if (!config.client_id || !config.nonce) {
      setupNote.hidden = false;
      return;
    }
    const renderButton = () => {
      const api = (window as Window & { google?: GoogleIdentity }).google;
      if (!api) {
        setupNote.hidden = false;
        setupNote.textContent =
          "Google sign-in couldn’t load. Check your connection and refresh.";
        return;
      }
      googleIdentity = api;
      api.accounts.id.initialize({
        client_id: config.client_id!,
        nonce: config.nonce!,
        callback: (response) => {
          void apiRequest<{ user: { id: number; email: string } }>(
            "/api/auth/google",
            {
              method: "POST",
              body: JSON.stringify({ credential: response.credential }),
            },
          )
            .then((data) => enterWorkspace(data.user))
            .catch((error) => {
              $("#auth-error").textContent =
                error instanceof Error
                  ? error.message
                  : "Google sign-in couldn’t be completed.";
            });
        },
      });
      googleIdentity.accounts.id.renderButton($("#google-signin-button"), {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: Math.max(
          200,
          Math.min(346, $("#google-signin-button").clientWidth),
        ),
      });
      $("#google-auth-area").hidden = false;
      setupNote.hidden = true;
    };
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if ((window as Window & { google?: GoogleIdentity }).google) {
      renderButton();
    } else if (existingScript) {
      existingScript.addEventListener("load", renderButton, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = renderButton;
      script.onerror = () => {
        setupNote.hidden = false;
        setupNote.textContent =
          "Google sign-in couldn’t load. Check your connection and refresh.";
      };
      document.head.append(script);
    }
  } catch {
    setupNote.hidden = false;
    setupNote.textContent = "Google sign-in is unavailable right now.";
  }
}

async function loadHistory() {
  const data = await apiRequest<{ decisions: DebateResult[] }>(
    "/api/decisions",
  );
  history = data.decisions;
  updateHistoryCount();
}

function enterWorkspace(user: { id: number; email: string }) {
  $("#user-email").textContent = user.email;
  $("#auth-view").classList.add("hidden");
  $(".app-shell").classList.remove("hidden");
  void loadHistory().catch((error) => {
    $("#form-error").textContent = error.message;
  });
}

function showView(view: "form" | "history") {
  const isHistory = view === "history";
  card.classList.toggle("hidden", isHistory);
  results.classList.add("hidden");
  loading.classList.add("hidden");
  $("#history-view").classList.toggle("hidden", !isHistory);
  $("#new-decision").classList.toggle("active", !isHistory);
  $("#show-history").classList.toggle("active", isHistory);
  $(".breadcrumb").innerHTML = isHistory
    ? "Decisions <span>/</span> <b>History</b>"
    : "Decisions <span>/</span> <b>New decision</b>";
  if (isHistory) renderHistory();
}

function renderHistory() {
  const view = $("#history-view");
  view.innerHTML = `<div class="history-header"><div><div class="eyebrow">YOUR PAST DECISIONS</div><h2>Decision history</h2><p>Saved to your account.</p></div>${history.length ? '<button class="clear-history" id="clear-history">Clear history</button>' : ""}</div>${history.length ? `<div class="history-list">${history.map((item, index) => `<button class="history-item" data-history="${index}"><span class="history-icon">✳</span><span><strong>${escapeHtml(item.topic)}</strong><small>${escapeHtml(item.verdict.slice(0, 115))}${item.verdict.length > 115 ? "…" : ""}</small></span><span class="history-arrow">→</span></button>`).join("")}</div>` : '<div class="empty-history"><span>◷</span><h3>No decisions yet</h3><p>Your completed debates will appear here.</p><button class="save-button" id="history-new">Start a decision</button></div>'}`;
  view
    .querySelector("#history-new")
    ?.addEventListener("click", () => showView("form"));
  view.querySelector("#clear-history")?.addEventListener("click", async () => {
    if (
      !window.confirm("Permanently clear all decisions saved to this account?")
    )
      return;
    try {
      await apiRequest("/api/decisions", { method: "DELETE" });
      history = [];
      updateHistoryCount();
      renderHistory();
    } catch (error) {
      view.insertAdjacentHTML(
        "afterbegin",
        `<p class="form-error">${escapeHtml(error instanceof Error ? error.message : "Could not clear history.")}</p>`,
      );
    }
  });
  view
    .querySelectorAll<HTMLButtonElement>("[data-history]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        displayResult(history[Number(button.dataset.history)], false),
      ),
    );
}

function displayResult(result: DebateResult, save = true) {
  if (save) {
    history.unshift(result);
    history = history.slice(0, 20);
    updateHistoryCount();
  }
  showView("form");
  card.classList.add("hidden");
  results.classList.remove("hidden");
  const sourcesHtml = (result.sources ?? []).length
    ? `<section class="sources-card"><div class="sources-heading"><span class="argument-label">RESEARCH SOURCES</span><span>${result.sources!.length} results from Tavily</span></div><div class="sources-list">${result
        .sources!.map((source, index) => {
          const safeUrl = /^https?:\/\//i.test(source.url) ? source.url : "#";
          return `<a class="source-item" id="source-${index + 1}" href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer"><span class="source-number">[${index + 1}]</span><span><strong>${escapeHtml(source.title)}</strong><small>${escapeHtml(source.url)}</small></span><span class="source-arrow">↗</span></a>`;
        })
        .join("")}</div></section>`
    : '<div class="evidence-note"><span>ⓘ</span><p>No search sources were returned. Treat factual claims as unverified.</p></div>';
  results.innerHTML = `<button class="back-link" id="back-to-form">← New decision</button><div class="result-heading"><div class="eyebrow"><span class="pulse"></span> DEBATE COMPLETE</div><h2>Your decision, examined.</h2><p class="result-topic">${escapeHtml(result.topic)}</p></div><div class="evidence-note"><span>ⓘ</span><p><strong>Evidence-led, still an AI analysis.</strong> The advocates use the linked search results where relevant. Verify important claims and consider how well each source applies to your situation.</p></div><div class="argument-grid"><article class="argument-card argument-for"><div class="argument-head"><span class="argument-symbol">↗</span><div><span class="argument-label">THE CASE FOR</span><h3>Reasons to say yes</h3></div></div><div class="argument-copy">${formatText(result.for, result.sources?.length ?? 0)}</div></article><article class="argument-card argument-against"><div class="argument-head"><span class="argument-symbol">↙</span><div><span class="argument-label">THE CASE AGAINST</span><h3>Reasons to pause</h3></div></div><div class="argument-copy">${formatText(result.against, result.sources?.length ?? 0)}</div></article></div>${sourcesHtml}<article class="verdict-card"><div class="verdict-head"><span class="verdict-icon">✦</span><div><span class="argument-label">THE JUDGE’S VIEW</span><h3>A considered recommendation</h3></div></div><div class="verdict-copy">${formatText(result.verdict, result.sources?.length ?? 0)}</div></article><div class="result-actions"><button class="secondary-button" id="copy-result">Copy summary</button><button class="start-button compact" id="another-decision"><span class="button-copy">Try another decision</span><span class="button-arrow">→</span></button></div>`;
  const decisionNotes = [
    result.options?.length === 2
      ? `<div class="option-comparison"><span class="argument-label">THE PATHS YOU’RE WEIGHING</span><div><span>${escapeHtml(result.options[0])}</span><b>OR</b><span>${escapeHtml(result.options[1])}</span></div></div>`
      : "",
    result.mind_changer
      ? `<div class="mind-changer-note"><span class="note-mark">↗</span><div><span class="argument-label">YOUR DECISION TEST</span><p>If this changes, revisit the call: <strong>${escapeHtml(result.mind_changer)}</strong></p></div></div>`
      : "",
  ].join("");
  results
    .querySelector(".result-heading")
    ?.insertAdjacentHTML("afterend", decisionNotes);
  $("#back-to-form").addEventListener("click", () => {
    results.classList.add("hidden");
    card.classList.remove("hidden");
  });
  $("#another-decision").addEventListener("click", resetForm);
  $("#copy-result").addEventListener("click", async () => {
    const optionText =
      result.options?.length === 2
        ? `\n\nOPTIONS\n${result.options.join(" vs. ")}`
        : "";
    const mindText = result.mind_changer
      ? `\n\nWHAT COULD CHANGE MY MIND\n${result.mind_changer}`
      : "";
    const sourceList = (result.sources ?? [])
      .map((source, index) => `[${index + 1}] ${source.title} — ${source.url}`)
      .join("\n");
    await navigator.clipboard.writeText(
      `Decision: ${result.topic}${optionText}${mindText}\n\nFOR\n${result.for}\n\nAGAINST\n${result.against}\n\nJUDGE\n${result.verdict}${sourceList ? `\n\nSOURCES\n${sourceList}` : ""}`,
    );
    $("#copy-result").textContent = "Copied ✓";
  });
}

function resetForm() {
  topicInput.value = "";
  optionOneInput.value = "";
  optionTwoInput.value = "";
  mindChangerInput.value = "";
  $("#char-count").textContent = "0 / 1200";
  results.classList.add("hidden");
  card.classList.remove("hidden");
  $("#form-error").textContent = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

topicInput.addEventListener("input", () => {
  $("#char-count").textContent = `${topicInput.value.length} / 1200`;
});
const decisionTemplates: Record<
  string,
  { topic: string; options: [string, string]; mind: string }
> = {
  career: {
    topic: "Should I accept a new job offer or stay in my current role?",
    options: ["Accept the new offer", "Stay in my current role"],
    mind: "What would make the new role worth the risk?",
  },
  home: {
    topic: "Which city should I move to for the next chapter of my life?",
    options: ["Move to the new city", "Stay where I am"],
    mind: "What would my everyday life need to look like?",
  },
  purchase: {
    topic: "Should I make this major purchase now or wait?",
    options: ["Buy now", "Wait and keep saving"],
    mind: "What price or financial cushion would make this feel right?",
  },
};
document
  .querySelectorAll<HTMLButtonElement>("[data-template]")
  .forEach((button) =>
    button.addEventListener("click", () => {
      const template = decisionTemplates[button.dataset.template ?? ""];
      if (!template) return;
      topicInput.value = template.topic;
      optionOneInput.value = template.options[0];
      optionTwoInput.value = template.options[1];
      mindChangerInput.value = template.mind;
      $("#char-count").textContent = `${topicInput.value.length} / 1200`;
      document
        .querySelectorAll("[data-template]")
        .forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
      topicInput.focus();
    }),
  );
document
  .querySelectorAll<HTMLButtonElement>("[data-auth-mode]")
  .forEach((tab) =>
    tab.addEventListener("click", () =>
      showAuth(tab.dataset.authMode as "login" | "signup"),
    ),
  );
$("#toggle-password").addEventListener("click", () => {
  const password = $("#auth-password") as HTMLInputElement;
  const confirmation = $("#auth-confirm-password") as HTMLInputElement;
  const shouldShow = password.type === "password";
  password.type = shouldShow ? "text" : "password";
  confirmation.type = shouldShow ? "text" : "password";
  $("#toggle-password").textContent = shouldShow ? "Hide" : "Show";
  $("#toggle-password").setAttribute(
    "aria-label",
    `${shouldShow ? "Hide" : "Show"} password`,
  );
});
$("#auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const email = ($("#auth-email") as HTMLInputElement).value.trim();
  const password = ($("#auth-password") as HTMLInputElement).value;
  const confirmPassword = $("#auth-confirm-password") as HTMLInputElement;
  if (authMode === "signup" && password !== confirmPassword.value) {
    $("#auth-error").textContent = "Those passwords don’t match yet.";
    confirmPassword.focus();
    return;
  }
  const button = $('#auth-form button[type="submit"]') as HTMLButtonElement;
  button.disabled = true;
  $("#auth-error").textContent = "";
  try {
    const data = await apiRequest<{ user: { id: number; email: string } }>(
      `/api/auth/${authMode === "login" ? "login" : "signup"}`,
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    );
    form.reset();
    enterWorkspace(data.user);
  } catch (error) {
    $("#auth-error").textContent =
      error instanceof Error ? error.message : "Could not sign in.";
  } finally {
    button.disabled = false;
  }
});
$("#logout").addEventListener("click", async () => {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } finally {
    history = [];
    updateHistoryCount();
    $(".app-shell").classList.add("hidden");
    showAuth("login");
    ($("#auth-view") as HTMLElement).classList.remove("hidden");
  }
});
void apiRequest<{ user: { id: number; email: string } | null }>("/api/auth/me")
  .then((data) => {
    if (data.user) enterWorkspace(data.user);
    else {
      showAuth("login");
      $("#auth-view").classList.remove("hidden");
    }
  })
  .catch(() => {
    showAuth("login");
    $("#auth-error").textContent =
      "The server is unavailable. Start the backend and refresh this page.";
  });
void configureGoogleSignIn();
$("#new-decision").addEventListener("click", () => {
  showView("form");
  resetForm();
});
$("#show-history").addEventListener("click", () => showView("history"));
$("#edit-criteria").addEventListener("click", () => {
  const criteriaInput = $("#criteria-input") as HTMLTextAreaElement;
  const criteriaDialog = $("#criteria-dialog") as HTMLDialogElement;
  criteriaInput.value = criteria.join("\n");
  criteriaDialog.showModal();
});
$("#save-criteria").addEventListener("click", (event) => {
  event.preventDefault();
  const criteriaInput = $("#criteria-input") as HTMLTextAreaElement;
  const criteriaDialog = $("#criteria-dialog") as HTMLDialogElement;
  criteria = criteriaInput.value
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 8);
  renderCriteria();
  criteriaDialog.close();
});
$("#how-it-works").addEventListener("click", () => {
  const helpDialog = $("#help-dialog") as HTMLDialogElement;
  helpDialog.showModal();
});
$("#start-debate").addEventListener("click", async () => {
  const topic = topicInput.value.trim();
  const options = [
    optionOneInput.value.trim(),
    optionTwoInput.value.trim(),
  ].filter(Boolean);
  const mind_changer = mindChangerInput.value.trim();
  const error = $("#form-error");
  error.textContent = "";
  if (topic.length < 12) {
    error.textContent =
      "Add a little more detail so both sides can make a useful case.";
    topicInput.focus();
    return;
  }
  if (!criteria.length) {
    error.textContent = "Add at least one decision criterion in the sidebar.";
    return;
  }
  if (options.length === 1) {
    error.textContent =
      "Add both options so the judge can compare them fairly, or leave both blank.";
    (optionOneInput.value.trim() ? optionTwoInput : optionOneInput).focus();
    return;
  }
  card.classList.add("hidden");
  loading.classList.remove("hidden");
  results.classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
  const steps = [
    "The advocate for is building its case…",
    "The advocate against is testing the other side…",
    "The judge is weighing your criteria…",
  ];
  const step = $("#loading-step");
  let index = 0;
  const timer = window.setInterval(() => {
    index = Math.min(index + 1, 2);
    step.textContent = steps[index];
  }, 6500);
  try {
    const response = await fetch("/api/debate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, criteria, options, mind_changer }),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(
        data.detail ||
          "The debate could not be completed. Check that the local API server is running.",
      );
    displayResult({
      id: data.id,
      created_at: data.created_at,
      topic,
      criteria,
      options: data.options ?? options,
      mind_changer: data.mind_changer ?? mind_changer,
      for: data.for,
      against: data.against,
      verdict: data.verdict,
      sources: data.sources,
    });
  } catch (cause) {
    card.classList.remove("hidden");
    error.textContent =
      cause instanceof Error
        ? cause.message
        : "Something went wrong. Please try again.";
  } finally {
    clearInterval(timer);
    loading.classList.add("hidden");
  }
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
    event.preventDefault();
    resetForm();
    showView("form");
  }
  if (event.key === "Escape")
    document
      .querySelectorAll("dialog[open]")
      .forEach((dialog) => (dialog as HTMLDialogElement).close());
});

renderCriteria();
updateHistoryCount();
