import "./style.css";

type DebateResult = {
  id?: number;
  created_at?: number;
  topic: string;
  criteria: string[];
  options?: string[];
  comparison_options?: string[];
  mind_changer?: string;
  context?: string;
  weights?: Record<string, number>;
  analysis?: Record<string, unknown>;
  red_team?: string;
  outcome?: { choice: string; notes?: string; usefulness?: string; source_trust?: number | null; updated_at?: number };
  image_analysis?: string;
  image_name?: string;
  framing?: string;
  research_review?: string;
  confidence?: "Low" | "Medium" | "High" | string;
  scorecard?: { option?: string; criterion: string; score: number | null; reasoning: string; sources?: number[] }[];
  change_triggers?: string[];
  scenarios?: { weights: Record<string, number>; assumption?: string; verdict: string; created_at: number }[];
  for: string;
  against: string;
  verdict: string;
  sources?: { title: string; url: string; content: string; published_date?: string | null }[];
};

const app = document.querySelector<HTMLDivElement>("#app")!;
const starterCriteria = [
  "Financial impact",
  "Career growth",
  "Lifestyle fit",
  "Risk and uncertainty",
];
let criteria = [...starterCriteria];
let criteriaWeights: Record<string, number> = Object.fromEntries(starterCriteria.map((item) => [item, 2]));
let history: DebateResult[] = [];
app.innerHTML = `
  <section class="auth-view" id="auth-view">
    <div class="auth-panel">
      <button type="button" class="theme-toggle auth-theme-toggle" aria-label="Switch to light theme" title="Switch to light theme">☼ Light</button>
      <div class="brand auth-brand"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4.5 7.5h13m0 0-3-3m3 3-3 3M19.5 16.5h-13m0 0 3-3m-3 3 3 3"/></svg></span><span>Counterpoint</span></div>
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
      <p class="auth-security">Your decisions stay in your private workspace. Passwords are securely hashed.</p>
    </div>
  </section>
  <div class="app-shell hidden">
    <aside class="sidebar">
      <a class="brand" href="#" aria-label="Counterpoint home"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4.5 7.5h13m0 0-3-3m3 3-3 3M19.5 16.5h-13m0 0 3-3m-3 3 3 3"/></svg></span><span>Counterpoint</span></a>
      <div class="side-label">Workspace</div>
      <button class="nav-item active" id="new-decision"><span>✳</span> New decision <kbd>⌘ N</kbd></button>
      <button class="nav-item" id="show-history"><span>◷</span> Decision history <span class="history-count"></span></button>
      <div class="side-label criteria-label">Your criteria <button id="edit-criteria" class="tiny-button" aria-label="Edit criteria">Edit</button></div>
      <div class="criteria-list"></div>
    </aside>
    <main class="main-content">
      <nav class="mobile-nav" aria-label="Workspace navigation"><button type="button" data-mobile-action="new" aria-current="page"><span aria-hidden="true">✳</span><b>New</b></button><button type="button" data-mobile-action="history"><span aria-hidden="true">◷</span><b>History</b></button><button type="button" data-mobile-action="criteria"><span aria-hidden="true">☷</span><b>Criteria</b></button></nav>
      <header class="topbar"><div class="breadcrumb">Decisions <span>/</span> <b>New decision</b></div><div class="top-actions"><span id="user-email" class="user-email"></span><button class="text-btn" id="logout">Sign out</button><button class="text-btn" id="how-it-works">How it works <span>↗</span></button><button type="button" class="theme-toggle" aria-label="Switch to light theme" title="Switch to light theme">☼ Light</button></div></header>
      <section class="intro"><div class="eyebrow"><span class="pulse"></span> EVIDENCE-LED DECISIONS</div><h1>Think it through.<br><em>Then decide.</em></h1><p>Put a real decision on trial. The team compares each path against your criteria<br class="desktop-only"> before a judge weighs the trade-offs.</p></section>
      <section class="decision-card" id="decision-card">
        <div class="card-heading"><div><span class="step-number">01</span><h2>What are you deciding?</h2></div></div>
        <div class="decision-prompts"><span>START WITH A COMMON CHOICE</span><div><button type="button" data-template="career">A career move</button><button type="button" data-template="home">Where to live</button><button type="button" data-template="purchase">Buy or wait</button></div></div>
        <label class="field-label" for="topic">Describe the decision you’re facing</label>
        <textarea id="topic" rows="3" maxlength="1200" placeholder="e.g. Should I leave my stable job to join an early-stage startup?"></textarea>
        <div class="input-meta"><span>Be as specific as you like. Your topic is sent to the AI and search providers to generate this analysis.</span><span id="char-count">0 / 1200</span></div>
        <div class="decision-setup">
          <div class="setup-heading"><span class="setup-index">A</span><div><strong>Name the paths you’re weighing</strong><small>Optional. Add 2–5 options, one per line. Include “wait” or “do nothing” if useful.</small></div></div>
          <div class="option-fields"><textarea id="options-input" rows="3" maxlength="510" placeholder="Buy in Jaipur&#10;Buy in Delhi&#10;Wait and save"></textarea></div>
          <label class="field-label mind-label" for="mind-changer">What would change your mind?</label>
          <input id="mind-changer" maxlength="400" placeholder="e.g. A commute under 30 minutes, or a lower monthly payment">
          <label class="field-label mind-label" for="decision-context">What should the team know about your situation?</label>
          <textarea id="decision-context" rows="3" maxlength="12000" placeholder="Constraints, budget, timeline, responsibilities, or anything that changes what a good choice looks like."></textarea>
          <div class="visual-attach"><label for="decision-image">Add visual evidence <span>Optional · JPG, PNG, or WebP · up to 5 MB</span></label><input id="decision-image" type="file" accept="image/jpeg,image/png,image/webp"><div class="visual-preview-row"><img id="image-preview" alt="Selected decision evidence" hidden><span id="image-status" role="status">A visual analyst will describe relevant details. The image is sent to Gemini and is not saved.</span><button id="remove-image" type="button" hidden>Remove</button></div></div>
          <p class="setup-note">Your answer helps the judge surface the assumptions that matter most.</p>
        </div>
        <div class="card-divider"></div>
        <div class="criteria-heading"><div><span class="step-number">02</span><h2>What matters most?</h2></div><span class="criteria-hint">Edit criteria in the sidebar</span></div>
        <div class="selected-criteria"></div>
        <div class="form-error" id="form-error" role="alert"></div>
        <button class="start-button" id="start-debate"><span class="button-copy">Start the debate</span><span class="button-arrow">→</span></button>
        <div class="privacy-foot">Your topic and criteria go to Tavily search. Decision details and context go to AI providers. Images go to Gemini, not web search; image bytes are not saved by this app, but their filename and analysis are. Saved analyses and outcome notes stay with your account.</div>
        <div class="deployment-warning hidden" id="deployment-warning" role="status"></div>
      </section>
      <section class="loading-card hidden" id="loading-card" aria-live="polite"><div class="loading-orbit"><span></span><span></span><span></span></div><div class="eyebrow">FIXED ROLE-BASED WORKFLOW</div><h2>Testing the decision from every side.</h2><p id="loading-step">Working through each stage; response times vary.</p><div class="loading-track"><span></span></div>${workflowTrailMarkup(false)}</section>
      <section class="results hidden" id="results"></section>
      <section class="history-view hidden" id="history-view"></section>
      <footer class="page-footer"><span>COUNTERPOINT</span><span>Groq · Gemini · Tavily</span></footer>
    </main>
  </div>
  <dialog id="criteria-dialog"><form method="dialog" class="dialog-card"><button class="dialog-close" aria-label="Close">×</button><span class="eyebrow">PERSONALIZE YOUR DEBATE</span><h2>Your decision criteria</h2><p>Add what you want the judge to prioritize. One per line.</p><textarea id="criteria-input" rows="6"></textarea><div class="dialog-actions"><button class="cancel-button">Cancel</button><button class="save-button" id="save-criteria" value="save">Save criteria</button></div></form></dialog>
  <dialog id="help-dialog"><form method="dialog" class="dialog-card help-card"><button class="dialog-close" aria-label="Close">×</button><span class="eyebrow">A CLEARER WAY TO CHOOSE</span><h2>How Counterpoint works</h2><div class="help-step"><b>01</b><p><strong>Frame the decision.</strong><br>A framing agent identifies assumptions and missing paths. Add context, priorities, and an optional image.</p></div><div class="help-step"><b>02</b><p><strong>Research the evidence.</strong><br>A researcher checks source relevance. Two advocates then make the strongest fair case on each side.</p></div><div class="help-step"><b>03</b><p><strong>Challenge the debate.</strong><br>A red team searches for blind spots before the judge weighs your criteria and gives a confidence-rated view.</p></div><div class="help-step"><b>04</b><p><strong>Stress-test and learn.</strong><br>Use the scorecard and priority sliders to explore alternate scenarios. Record what happened to learn from the decision.</p></div><p class="help-note">Images are sent to Gemini for analysis. AI analysis can be wrong; check source links and verify important facts.</p><button class="save-button">Got it</button></form></dialog>
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
const optionsInput = $("#options-input") as HTMLTextAreaElement;
const mindChangerInput = $("#mind-changer") as HTMLInputElement;
const decisionContextInput = $("#decision-context") as HTMLTextAreaElement;
const decisionImageInput = $("#decision-image") as HTMLInputElement;
const imagePreview = $("#image-preview") as HTMLImageElement;
const imageStatus = $("#image-status");

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
          `<label class="selected-chip"><i class="dot dot-${index % 4}"></i><span>${escapeHtml(item)}</span><select class="criterion-weight" data-weight-for="${escapeHtml(item)}" aria-label="Priority for ${escapeHtml(item)}"><option value="1" ${criteriaWeights[item] === 1 ? "selected" : ""}>Lower</option><option value="2" ${!criteriaWeights[item] || criteriaWeights[item] === 2 ? "selected" : ""}>Normal</option><option value="3" ${criteriaWeights[item] === 3 ? "selected" : ""}>Highest</option></select></label>`,
      )
      .join("") ||
    '<span class="criteria-hint">No criteria selected. Add some in the sidebar.</span>';
  document.querySelectorAll<HTMLSelectElement>(".criterion-weight").forEach((select) => {
    select.addEventListener("change", () => {
      const name = select.dataset.weightFor;
      if (name) criteriaWeights[name] = Number(select.value);
    });
  });
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

function fileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? "");
      const comma = value.indexOf(",");
      if (comma < 0) reject(new Error("The image could not be read."));
      else resolve(value.slice(comma + 1));
    };
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.readAsDataURL(file);
  });
}

let imagePreviewUrl = "";
decisionImageInput.addEventListener("change", () => {
  const file = decisionImageInput.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    decisionImageInput.value = "";
    imageStatus.textContent = "Choose an image smaller than 5 MB.";
    return;
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    decisionImageInput.value = "";
    imageStatus.textContent = "Choose a JPG, PNG, or WebP image.";
    return;
  }
  if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
  imagePreviewUrl = URL.createObjectURL(file);
  imagePreview.src = imagePreviewUrl;
  imagePreview.hidden = false;
  $("#remove-image").hidden = false;
  imageStatus.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB · sent to Gemini for analysis, not saved`;
});
$("#remove-image").addEventListener("click", () => {
  decisionImageInput.value = "";
  if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
  imagePreviewUrl = "";
  imagePreview.removeAttribute("src");
  imagePreview.hidden = true;
  $("#remove-image").hidden = true;
  imageStatus.textContent = "A visual analyst will describe relevant details. The image is sent to Gemini and is not saved.";
});

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
    throw new Error(formatApiError(data.detail, "The request could not be completed."));
  return data as T;
}

async function checkDeploymentContract() {
  try {
    const contract = await apiRequest<{ options?: { maximum?: number } }>("/api/version");
    if ((contract.options?.maximum ?? 5) < 5) {
      $("#deployment-warning").textContent =
        "This deployment is outdated and currently supports only two options. The latest client supports up to five.";
      $("#deployment-warning").classList.remove("hidden");
    }
  } catch {
    // Older deployments do not expose /api/version; normal functionality remains available.
  }
}

function formatApiError(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const message = (item as { msg?: unknown }).msg;
        return typeof message === "string" ? message : "";
      })
      .filter(Boolean);
    if (messages.length) return messages.join(" ");
  }
  if (detail && typeof detail === "object") {
    const message = (detail as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
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
  void checkDeploymentContract();
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
  app.querySelectorAll<HTMLButtonElement>("[data-mobile-action]").forEach((button) => {
    const selected = button.dataset.mobileAction === (isHistory ? "history" : "new");
    if (selected) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  $(".breadcrumb").innerHTML = isHistory
    ? "Decisions <span>/</span> <b>History</b>"
    : "Decisions <span>/</span> <b>New decision</b>";
  if (isHistory) renderHistory();
}

function renderHistory() {
  const view = $("#history-view");
  const recordedOutcomes = history.filter((item) => item.outcome?.choice).length;
  view.innerHTML = `<div class="history-header"><div><div class="eyebrow">YOUR PAST DECISIONS</div><h2>Decision history</h2><p>${history.length} saved decisions · ${recordedOutcomes} outcomes recorded</p></div><div class="history-actions">${recordedOutcomes >= 2 ? '<button class="secondary-button" id="learning-review">Review what you learned</button>' : ""}${history.length ? '<button class="clear-history" id="clear-history">Clear history</button>' : ""}</div></div>${history.length ? `<div class="history-list">${history.map((item, index) => `<button class="history-item" data-history="${index}"><span class="history-icon">✳</span><span><strong>${escapeHtml(item.topic)}</strong><small>${escapeHtml(item.verdict.slice(0, 115))}${item.verdict.length > 115 ? "…" : ""}</small>${item.outcome?.choice ? `<small class="history-outcome">Outcome: ${escapeHtml(item.outcome.choice)}</small>` : ""}</span><span class="history-arrow">→</span></button>`).join("")}</div>` : '<div class="empty-history"><span>◷</span><h3>No decisions yet</h3><p>Your completed debates will appear here.</p><button class="save-button" id="history-new">Start a decision</button></div>'}<div class="learning-review-result" id="learning-review-result"></div>`;
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
  view.querySelector("#learning-review")?.addEventListener("click", async (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    const result = view.querySelector<HTMLElement>("#learning-review-result")!;
    button.disabled = true;
    button.textContent = "Reviewing outcomes…";
    result.textContent = "Comparing your reported choices, notes, and evidence across decisions. These details are sent to Gemini for this review.";
    try {
      const review = await apiRequest<{ review: string; outcomes_reviewed: number }>(
        "/api/decisions/learning-review",
        { method: "POST" },
      );
      result.innerHTML = `<div class="eyebrow">LEARNING REVIEW · ${review.outcomes_reviewed} REPORTED OUTCOMES</div>${formatText(review.review)}`;
    } catch (cause) {
      result.textContent = cause instanceof Error ? cause.message : "Could not create a learning review.";
    } finally {
      button.disabled = false;
      button.textContent = "Review what you learned";
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

function formatScenarioLabel(scenario: NonNullable<DebateResult["scenarios"]>[number]) {
  const priorities = Object.entries(scenario.weights)
    .map(([criterion, weight]) => `${criterion}: ${weight === 3 ? "highest" : weight === 1 ? "lower" : "normal"}`)
    .join(" · ");
  return [scenario.assumption, priorities].filter(Boolean).map((value) => escapeHtml(value ?? "")).join(" · ");
}

function workflowTrailMarkup(completed: boolean) {
  const stages = ["Frame", "Research", "Advocate", "Red team", "Judge"];
  return `<ol class="workflow-trail ${completed ? "is-complete" : "is-running"}" aria-label="Fixed role-based analysis workflow">${stages.map((stage, index) => `<li data-workflow-stage="${index}"><span class="workflow-index">0${index + 1}</span><strong>${stage}</strong>${completed ? '<span class="workflow-status">Done</span>' : '<span class="workflow-status">Queued</span>'}</li>`).join("")}</ol>`;
}

function updateWorkflowStage(activeIndex: number) {
  document.querySelectorAll<HTMLElement>("[data-workflow-stage]").forEach((stage, index) => {
    stage.classList.toggle("is-active", index === activeIndex);
    const status = stage.querySelector(".workflow-status");
    if (status) status.textContent = index < activeIndex ? "Done" : index === activeIndex ? "Working" : "Queued";
  });
}

function agentWorkflowMarkup(result: DebateResult) {
  const sources = result.sources?.length ?? 0;
  const userInputs = [
    `Decision: ${result.topic}`,
    ...(result.options ?? []).map((option) => `Option: ${option}`),
    ...(result.criteria ?? []).map((criterion) => `Priority: ${criterion} (${result.weights?.[criterion] === 3 ? "high" : result.weights?.[criterion] === 1 ? "lower" : "normal"})`),
    ...(result.context ? [`Context supplied by you: ${result.context}`] : []),
    ...(result.mind_changer ? [`Your decision test: ${result.mind_changer}`] : []),
  ].map(escapeHtml).join("<br>");
  const sourceLinks = (result.sources ?? []).map((source, index) => {
    const url = /^https?:\/\//i.test(source.url) ? source.url : "#";
    return `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">[${index + 1}] ${escapeHtml(source.title)}</a> <span class="source-provenance">retrieved; not independently verified</span></li>`;
  }).join("");
  const commonInput = `${userInputs}<p class="provenance-explainer">User-provided details are taken as supplied; the system does not independently verify them.</p>`;
  const visualInput = result.image_analysis ? `<p>AI visual interpretation supplied to this role:</p>${formatText(result.image_analysis, sources)}` : "";
  const evaluatorInput = (result.scorecard ?? []).map((item) => `<p>${escapeHtml(item.option || "Option")} / ${escapeHtml(item.criterion)}: ${item.score == null ? "No estimate returned" : `${Math.max(0, Math.min(5, Number(item.score) || 0))}/5`} - ${formatText(item.reasoning, sources)}</p>`).join("");
  const cards = [
    { name: "Framer", label: "AI-generated framing, unknowns, and assumptions", input: `${commonInput || "Decision topic and criteria supplied in the form."}<p>Role: frame the choice, identify unknowns, and suggest research angles.</p>`, uncertainty: "Identifies missing information and assumptions; these are prompts for review, not verified facts.", body: formatText(result.framing || "No framing notes were returned.", sources) },
    { name: "Research", label: "AI-generated source assessment", input: `${formatText(result.framing || "Decision topic and criteria.", sources)}${sourceLinks ? `<ul>${sourceLinks}</ul>` : "No search results were retrieved."}`, uncertainty: "Search snippets may be incomplete, outdated, or irrelevant. Their claims have not been independently verified.", body: formatText(result.research_review || "No research appraisal was returned.", sources) },
    { name: "Advocate", label: "AI-generated arguments", input: `${commonInput}<p>Framing:</p>${formatText(result.framing || "No framing returned.", sources)}<p>Research assessment:</p>${formatText(result.research_review || "No assessment returned.", sources)}${sourceLinks ? `<p>Retrieved sources supplied to the advocates:</p><ul>${sourceLinks}</ul>` : "<p>No search sources were supplied.</p>"}${result.image_analysis ? `<p>AI visual interpretation supplied:</p>${formatText(result.image_analysis, sources)}` : ""}`, uncertainty: "Arguments interpret supplied context and retrieved material; unsupported points may rely on assumptions.", body: `<section class="agent-side"><b>Case for</b>${formatText(result.for, sources)}</section><section class="agent-side"><b>Case against</b>${formatText(result.against, sources)}</section>` },
    { name: "Red team", label: "AI-generated critique", input: `<p>Reviews the advocate cases, user-supplied decision details, research assessment, and retrieved sources.</p>${commonInput}${visualInput}<p>Case for:</p>${formatText(result.for, sources)}<p>Case against:</p>${formatText(result.against, sources)}<p>Research assessment:</p>${formatText(result.research_review || "No assessment returned.", sources)}${sourceLinks ? `<ul>${sourceLinks}</ul>` : "<p>No search sources were supplied.</p>"}`, uncertainty: "The critique can miss risks or alternatives; it is not an exhaustive review.", body: formatText(result.red_team || "No red-team review was returned.", sources) },
    { name: "Judge", label: "AI-generated recommendation", input: `<p>Considers user-supplied details, evidence, both advocate cases, the red-team review, and the parallel option-by-criterion assessment.</p>${commonInput}${visualInput}<p>Case for:</p>${formatText(result.for, sources)}<p>Case against:</p>${formatText(result.against, sources)}<p>Red-team review:</p>${formatText(result.red_team || "No review returned.", sources)}<p>Research assessment:</p>${formatText(result.research_review || "No assessment returned.", sources)}<p>Parallel criteria evaluator input to Judge:</p>${evaluatorInput}${sourceLinks ? `<ul>${sourceLinks}</ul>` : "<p>No search sources were supplied.</p>"}`, uncertainty: `Confidence: ${escapeHtml(result.confidence ?? "Medium")}. Scores are rough AI judgments, not measurements. The recommendation can be wrong or incomplete.`, body: `${formatText(result.verdict, sources)}${result.scorecard?.length ? `<h4>Criteria evaluator contribution (parallel to red-team review)</h4>${result.scorecard.map((item) => `<p><strong>${escapeHtml(item.option || "Option")} / ${escapeHtml(item.criterion)}:</strong> ${item.score == null ? "No estimate returned" : `${Math.max(0, Math.min(5, Number(item.score) || 0))}/5`}; ${formatText(item.reasoning, sources)}</p>`).join("")}` : ""}${result.change_triggers?.length ? `<h4>AI-generated change triggers</h4><ul>${result.change_triggers.map((trigger) => `<li>${escapeHtml(trigger)}</li>`).join("")}</ul>` : ""}` },
  ];
  return `<section class="agent-workflow"><div class="agent-workflow-heading"><div><span class="eyebrow">FIXED ROLE-BASED MODEL WORKFLOW</span><h3>How this brief was built</h3></div><span class="workflow-key">Model calls follow preset roles; some stages run in parallel. They do not plan tasks, operate tools, or take actions.</span></div>${workflowTrailMarkup(true)}<p class="workflow-responsibility">This brief supports your judgment. A person remains responsible for verifying important facts and deciding whether to take any consequential action.</p><div class="workflow-disclosures">${cards.map((card, index) => `<details class="workflow-agent"><summary><span class="workflow-index">0${index + 1}</span><strong>${card.name}</strong><span class="provenance-chip provenance-inference">${card.label}</span><span class="disclosure-caret" aria-hidden="true"></span></summary><div class="workflow-agent-body"><div class="workflow-field"><b>Input</b><div>${card.input}</div></div><div class="workflow-field"><b>Contribution</b><div>${card.body}</div></div><div class="workflow-field workflow-uncertainty"><b>Uncertainty and limits</b><p>${card.uncertainty}</p></div></div></details>`).join("")}</div></section>`;
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
          const date = source.published_date ? ` · Published ${escapeHtml(source.published_date)}` : "";
          return `<a class="source-item" id="source-${index + 1}" href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer"><span class="source-number">[${index + 1}]</span><span><strong>${escapeHtml(source.title)}</strong><small class="source-provenance">Retrieved result; not independently verified${date}</small><small>${escapeHtml(source.url)}</small></span><span class="source-arrow">↗</span></a>`;
        })
        .join("")}</div></section>`
    : '<div class="evidence-note"><span>ⓘ</span><p>No search sources were returned. Treat factual claims as unverified.</p></div>';
  results.innerHTML = `<button class="back-link" id="back-to-form">← New decision</button><div class="result-heading"><div class="eyebrow"><span class="pulse"></span> DEBATE COMPLETE</div><h2>Your decision, examined.</h2><p class="result-topic">${escapeHtml(result.topic)}</p></div><div class="evidence-note"><span>ⓘ</span><p><strong>Evidence-led, still an AI analysis.</strong> The advocates use the linked search results where relevant. Verify important claims and consider how well each source applies to your situation.</p></div>${sourcesHtml}<article class="verdict-card"><div class="verdict-head"><span class="verdict-icon">✦</span><div><span class="argument-label">THE JUDGE’S VIEW</span><h3>A considered recommendation</h3></div></div><div class="verdict-copy">${formatText(result.verdict, result.sources?.length ?? 0)}</div></article><div class="result-actions"><button class="secondary-button" id="copy-result">Copy summary</button><button class="secondary-button" id="download-brief">Download decision brief</button><button class="start-button compact" id="another-decision"><span class="button-copy">Try another decision</span><span class="button-arrow">→</span></button></div>`;
  results.querySelector(".evidence-note")?.insertAdjacentHTML("afterend", agentWorkflowMarkup(result));
  if (result.id) {
    const outcomeMarkup = `<section class="outcome-card"><div class="verdict-head"><span class="verdict-icon">↻</span><div><span class="argument-label">CLOSE THE LOOP</span><h3>What did you decide?</h3></div></div><p>Record your choice and whether the analysis helped. Your feedback improves your personal learning review.</p><label for="outcome-choice">Your choice</label><input id="outcome-choice" maxlength="100" value="${escapeHtml(result.outcome?.choice ?? "")}" placeholder="e.g. I accepted the offer"><label for="outcome-notes">What happened? <span>Optional</span></label><textarea id="outcome-notes" maxlength="2000" rows="2" placeholder="Add an update now, or come back after the decision plays out.">${escapeHtml(result.outcome?.notes ?? "")}</textarea><div class="outcome-ratings"><label for="outcome-usefulness">Did this analysis help?<select id="outcome-usefulness"><option value="">Skip for now</option><option value="yes" ${result.outcome?.usefulness === "yes" ? "selected" : ""}>Yes</option><option value="partly" ${result.outcome?.usefulness === "partly" ? "selected" : ""}>Partly</option><option value="no" ${result.outcome?.usefulness === "no" ? "selected" : ""}>No</option></select></label><label for="outcome-source-trust">Trust in the evidence<select id="outcome-source-trust"><option value="">Skip for now</option>${[1, 2, 3, 4, 5].map((value) => `<option value="${value}" ${result.outcome?.source_trust === value ? "selected" : ""}>${value} / 5</option>`).join("")}</select></label></div><div class="outcome-actions"><button class="secondary-button" id="save-outcome">Save outcome</button><span id="outcome-status" role="status">${result.outcome?.updated_at ? "Saved to this decision" : ""}</span></div></section>`;
    results.querySelector(".verdict-card")?.insertAdjacentHTML("afterend", outcomeMarkup);
    $("#save-outcome").addEventListener("click", async () => {
      const choice = ($("#outcome-choice") as HTMLInputElement).value.trim();
      const notes = ($("#outcome-notes") as HTMLTextAreaElement).value.trim();
      const usefulness = ($("#outcome-usefulness") as HTMLSelectElement).value;
      const trustValue = ($("#outcome-source-trust") as HTMLSelectElement).value;
      const status = $("#outcome-status");
      if (!choice) {
        status.textContent = "Enter the choice you made first.";
        return;
      }
      const button = $("#save-outcome") as HTMLButtonElement;
      button.disabled = true;
      status.textContent = "Saving…";
      try {
        const saved = await apiRequest<{ outcome: NonNullable<DebateResult["outcome"]> }>(
          `/api/decisions/${result.id}/outcome`,
          { method: "PATCH", body: JSON.stringify({ choice, notes, usefulness, source_trust: trustValue ? Number(trustValue) : null }) },
        );
        result.outcome = saved.outcome;
        status.textContent = "Saved to this decision";
      } catch (cause) {
        status.textContent = cause instanceof Error ? cause.message : "Could not save this outcome.";
      } finally {
        button.disabled = false;
      }
    });
  }
  const decisionNotes = [
    (result.options?.length ?? 0) >= 2
      ? `<div class="option-comparison"><span class="argument-label">USER-PROVIDED OPTIONS</span><div class="option-paths">${result.options!.map((option, index) => `<span>${escapeHtml(option)}</span>${index < result.options!.length - 1 ? "<b>OR</b>" : ""}`).join("")}</div></div>`
      : "",
    result.mind_changer
      ? `<div class="mind-changer-note"><span class="note-mark">↗</span><div><span class="argument-label">USER-PROVIDED DECISION TEST</span><p>If this changes, revisit the call: <strong>${escapeHtml(result.mind_changer)}</strong></p></div></div>`
      : "",
    result.context
      ? `<div class="mind-changer-note"><span class="note-mark">◎</span><div><span class="argument-label">USER-PROVIDED CONTEXT</span><p>${escapeHtml(result.context)}</p></div></div>`
      : "",
    result.image_analysis
      ? `<div class="image-analysis-note"><span class="note-mark">▧</span><div><span class="argument-label">AI-GENERATED VISUAL INTERPRETATION${result.image_name ? ` · ${escapeHtml(result.image_name)}` : ""}</span><div class="verdict-copy">${formatText(result.image_analysis, result.sources?.length ?? 0)}</div><small>The image was analyzed by AI. Verify important details against the original.</small></div></div>`
      : "",
    result.criteria.length
      ? `<div class="mind-changer-note"><span class="note-mark">≋</span><div><span class="argument-label">USER-SET PRIORITIES</span><p>${result.criteria.map((item) => `${escapeHtml(item)} · ${result.weights?.[item] === 3 ? "highest" : result.weights?.[item] === 1 ? "lower" : "normal"}`).join(" &nbsp; / &nbsp; ")}</p></div></div>`
      : "",
  ].join("");
  results
    .querySelector(".result-heading")
    ?.insertAdjacentHTML("afterend", decisionNotes);
  if (result.scorecard?.length || result.change_triggers?.length || result.id) {
    const scorecardHtml = result.scorecard?.length
      ? `<section class="scorecard-panel"><div class="verdict-head"><span class="verdict-icon">◒</span><div><span class="argument-label">AI-GENERATED OPTION COMPARISONS - ROUGH FIT, NOT MEASUREMENTS</span><h3>Trade-offs by option and criterion</h3></div><span class="confidence-badge">${escapeHtml(result.confidence ?? "Medium")} confidence</span></div>${!result.options?.length ? '<p class="scorecard-note">No options were entered, so these two broad comparison paths were inferred.</p>' : ""}<div class="scorecard-list">${result.scorecard.map((item) => {
          const score = item.score == null ? null : Math.max(0, Math.min(5, Number(item.score) || 0));
          return `<article class="scorecard-item"><div class="scorecard-title"><strong>${escapeHtml(item.option || "Prior decision")}: ${escapeHtml(item.criterion)}</strong><span>${score == null ? "No estimate" : `${score} / 5`}</span></div>${score == null ? "" : `<div class="score-track" role="progressbar" aria-label="${escapeHtml(item.option || "Prior decision")} fit for ${escapeHtml(item.criterion)}" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${score}"><i style="width:${score * 20}%"></i></div>`}<p>${formatText(item.reasoning, result.sources?.length ?? 0)}</p></article>`;
        }).join("")}</div></section>`
      : "";
    const triggersHtml = result.change_triggers?.length
      ? `<section class="change-triggers"><span class="argument-label">AI-GENERATED CHANGE TRIGGERS</span><ul>${result.change_triggers.map((trigger) => `<li>${escapeHtml(trigger)}</li>`).join("")}</ul></section>`
      : "";
    const scenarioHtml = result.id
      ? `<section class="scenario-panel"><div class="verdict-head"><span class="verdict-icon">⇄</span><div><span class="argument-label">SCENARIO SWITCHES</span><h3>What if the conditions changed?</h3></div></div><p>Change what matters or test a concrete assumption. The judge will reuse this evidence and explain whether the recommendation shifts.</p><div class="scenario-controls">${result.criteria.map((item) => `<label class="scenario-control"><span>${escapeHtml(item)}</span><input type="range" min="1" max="3" step="1" value="${result.weights?.[item] ?? 2}" data-scenario-weight="${escapeHtml(item)}"><span data-scenario-label="${escapeHtml(item)}">${result.weights?.[item] === 3 ? "Highest" : result.weights?.[item] === 1 ? "Lower" : "Normal"}</span></label>`).join("")}</div><label class="scenario-assumption-label" for="scenario-assumption">Test an assumption <span>Optional</span></label><input class="scenario-assumption" id="scenario-assumption" maxlength="1000" placeholder="e.g. Assume the start date slips by three months"><button class="secondary-button" id="run-scenario">Reassess this scenario</button><span id="scenario-status" role="status"></span><div id="scenario-result">${(result.scenarios ?? []).slice(-3).map((scenario) => `<article class="scenario-result"><span class="argument-label">${formatScenarioLabel(scenario) || "Saved scenario"}</span>${formatText(scenario.verdict, result.sources?.length ?? 0)}</article>`).join("")}</div></section>`
      : "";
    results.querySelector(".verdict-card")?.insertAdjacentHTML(
      "afterend",
      `<div class="decision-panels">${scorecardHtml}${triggersHtml}${scenarioHtml}</div>`,
    );
    results.querySelectorAll<HTMLInputElement>("[data-scenario-weight]").forEach((input) => {
      input.addEventListener("input", () => {
        const name = input.dataset.scenarioWeight;
        if (!name) return;
        const label = results.querySelector<HTMLElement>(`[data-scenario-label="${CSS.escape(name)}"]`);
        if (label) label.textContent = input.value === "3" ? "Highest" : input.value === "1" ? "Lower" : "Normal";
      });
    });
    results.querySelector("#run-scenario")?.addEventListener("click", async () => {
      const status = $("#scenario-status");
      const button = $("#run-scenario") as HTMLButtonElement;
      const changedWeights = Object.fromEntries(
        Array.from(results.querySelectorAll<HTMLInputElement>("[data-scenario-weight]"))
          .map((input) => [input.dataset.scenarioWeight!, Number(input.value)]),
      );
      const assumption = ($("#scenario-assumption") as HTMLInputElement).value.trim();
      button.disabled = true;
      status.textContent = "The judge is reweighing the same evidence…";
      try {
        const response = await apiRequest<{ scenario: NonNullable<DebateResult["scenarios"]>[number] }>(
          `/api/decisions/${result.id}/scenario`,
          { method: "POST", body: JSON.stringify({ weights: changedWeights, assumption }) },
        );
        result.scenarios = [...(result.scenarios ?? []), response.scenario];
        status.textContent = "Scenario saved with this decision.";
        $("#scenario-result").insertAdjacentHTML(
          "afterbegin",
          `<article class="scenario-result"><span class="argument-label">${formatScenarioLabel(response.scenario) || "Alternate scenario"}</span>${formatText(response.scenario.verdict, result.sources?.length ?? 0)}</article>`,
        );
      } catch (cause) {
        status.textContent = cause instanceof Error ? cause.message : "Could not reassess this scenario.";
      } finally {
        button.disabled = false;
      }
    });
  }
  $("#back-to-form").addEventListener("click", () => {
    results.classList.add("hidden");
    card.classList.remove("hidden");
  });
  $("#another-decision").addEventListener("click", resetForm);
  $("#copy-result").addEventListener("click", async () => {
    const optionText =
      (result.options?.length ?? 0) >= 2
        ? `\n\nOPTIONS\n${result.options!.join(" vs. ")}`
        : "";
    const mindText = result.mind_changer
      ? `\n\nWHAT COULD CHANGE MY MIND\n${result.mind_changer}`
      : "";
    const contextText = result.context
      ? `\n\nMY CONTEXT\n${result.context}`
      : "";
    const priorityText = result.criteria
      .map((item) => `${item}: ${result.weights?.[item] === 3 ? "highest" : result.weights?.[item] === 1 ? "lower" : "normal"}`)
      .join("\n");
    const sourceList = (result.sources ?? [])
      .map((source, index) => `[${index + 1}] ${source.title} — ${source.url}`)
      .join("\n");
    await navigator.clipboard.writeText(
      `Decision: ${result.topic}${optionText}${mindText}${contextText}\n\nPRIORITIES\n${priorityText}${result.image_analysis ? `\n\nAI-GENERATED VISUAL INTERPRETATION${result.image_name ? ` (${result.image_name})` : ""}\n${result.image_analysis}` : ""}\n\nFOR\n${result.for}\n\nAGAINST\n${result.against}\n\nRED TEAM\n${result.red_team ?? ""}\n\nJUDGE\n${result.verdict}${sourceList ? `\n\nSOURCES\n${sourceList}` : ""}`,
    );
    $("#copy-result").textContent = "Copied ✓";
  });
  $("#download-brief").addEventListener("click", () => {
    const sourceText = (result.sources ?? []).map((source, index) => `[${index + 1}] ${source.title} — ${source.url}`).join("\n");
    const scoreText = (result.scorecard ?? []).map((item) => `### ${item.criterion} — ${item.score}/5\n${item.reasoning}`).join("\n\n");
    const scenarioText = (result.scenarios ?? []).map((item) => `## Alternate scenario: ${formatScenarioLabel(item)}\n${item.verdict}`).join("\n\n");
    const brief = [
      `# Decision brief: ${result.topic}`,
      result.options?.length ? `## Options\n${result.options.map((option) => `- ${option}`).join("\n")}` : "",
      `## Recommendation\n${result.verdict}`,
      `## Criterion scorecard (${result.confidence ?? "Medium"} confidence)\n${scoreText}`,
      result.change_triggers?.length ? `## What would change this view\n${result.change_triggers.map((trigger) => `- ${trigger}`).join("\n")}` : "",
      result.framing ? `## Framing agent\n${result.framing}` : "",
      result.research_review ? `## Researcher\n${result.research_review}` : "",
      `## Case for\n${result.for}`,
      `## Case against\n${result.against}`,
      result.red_team ? `## Red-team review\n${result.red_team}` : "",
      result.image_analysis ? `## Visual evidence (${result.image_name ?? "attached image"})\n${result.image_analysis}` : "",
      sourceText ? `## Sources\n${sourceText}` : "",
      scenarioText,
      result.outcome ? `## Outcome recorded\nChoice: ${result.outcome.choice}\n${result.outcome.notes ?? ""}` : "",
    ].filter(Boolean).join("\n\n");
    const blobUrl = URL.createObjectURL(new Blob([brief], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    const slug = result.topic.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "decision";
    link.href = blobUrl;
    link.download = `${slug}-decision-brief.md`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  });
}

function resetForm() {
  topicInput.value = "";
  optionsInput.value = "";
  mindChangerInput.value = "";
  decisionContextInput.value = "";
  $("#remove-image").click();
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
      optionsInput.value = template.options.join("\n");
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
$("#new-decision").addEventListener("click", () => {
  showView("form");
  resetForm();
});
$("#show-history").addEventListener("click", () => showView("history"));
app.querySelectorAll<HTMLButtonElement>("[data-mobile-action]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.mobileAction === "history") $("#show-history").click();
    else if (button.dataset.mobileAction === "criteria") $("#edit-criteria").click();
    else $("#new-decision").click();
  });
});
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
  const options = optionsInput.value.split("\n").map((option) => option.trim()).filter(Boolean);
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
      "Add at least two options so the judge can compare them fairly, or leave the options blank.";
    optionsInput.focus();
    return;
  }
  if (options.length > 5) {
    error.textContent = "Compare up to five options at a time.";
    optionsInput.focus();
    return;
  }
  if (new Set(options.map((option) => option.toLocaleLowerCase())).size !== options.length) {
    error.textContent = "Each option should be distinct.";
    optionsInput.focus();
    return;
  }
  card.classList.add("hidden");
  loading.classList.remove("hidden");
  results.classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
  const attachedImage = decisionImageInput.files?.[0];
  const workflowSteps = [
    "The framer is surfacing assumptions and missing paths…",
    "The researcher is checking sources against the decision…",
    "The advocates are building both cases…",
    "The red team is looking for blind spots…",
    "The judge is weighing the evidence and your priorities…",
  ];
  let workflowIndex = 0;
  const workflowTimer = window.setInterval(() => {
    workflowIndex = Math.min(workflowIndex + 1, workflowSteps.length - 1);
    $("#loading-step").textContent = workflowSteps[workflowIndex];
    updateWorkflowStage(workflowIndex);
  }, 6500);
  $("#loading-step").textContent = workflowSteps[0];
  updateWorkflowStage(0);
  try {
    const imageData = attachedImage ? await fileAsBase64(attachedImage) : null;
    const response = await fetch("/api/debate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        criteria,
        options,
        mind_changer,
        context: decisionContextInput.value.trim(),
        weights: criteriaWeights,
        image_data: imageData,
        image_mime: attachedImage?.type ?? null,
        image_name: attachedImage?.name ?? null,
      }),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(formatApiError(
        data.detail,
        "The debate could not be completed. Check that the local API server is running.",
      ));
    displayResult({
      id: data.id,
      created_at: data.created_at,
      topic,
      criteria,
      options: data.options ?? options,
      mind_changer: data.mind_changer ?? mind_changer,
      context: data.context ?? decisionContextInput.value.trim(),
      weights: data.weights ?? criteriaWeights,
      analysis: data.analysis,
      red_team: data.red_team,
      image_analysis: data.image_analysis,
      image_name: data.image_name,
      framing: data.framing,
      research_review: data.research_review,
      scorecard: data.scorecard,
      comparison_options: data.comparison_options,
      confidence: data.confidence,
      change_triggers: data.change_triggers,
      scenarios: data.scenarios ?? [],
      outcome: data.outcome,
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
    window.clearInterval(workflowTimer);
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
