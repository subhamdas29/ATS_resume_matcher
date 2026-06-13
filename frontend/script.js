  const API_BASE = (window.ENV_API_URL || "").replace(/\/$/, "") || "atsresumematcher-production.up.railway.app";
  
  let hasValidResults = false;

  window.addEventListener('error', (event) => {
    console.error("Error:", event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error("Unhandled rejection:", event.reason);
  });

  const landingPage = document.getElementById("landingPage");
  const matcherPage = document.getElementById("matcherPage");
  const resultPage = document.getElementById("resultPage");
  const resultPageContent = document.getElementById("resultPageContent");
  const aboutPage = document.getElementById("aboutPage");
  const contributorsPage = document.getElementById("contributorsPage");
  const openMatcherBtn = document.getElementById("openMatcherBtn");
  const analyzeBtn = document.getElementById("analyzeBtn");

  const pageHashMap = {
    matcherPage: "matcher",
    resultPage: "results",
    aboutPage: "about",
    contributorsPage: "contributors"
  };

  const hashPageMap = {
    matcher: "matcherPage",
    results: "resultPage",
    about: "aboutPage",
    contributors: "contributorsPage"
  };

  function showPage(pageId, updateHash = true, keepResults = false) {
    landingPage.style.display = "none";
    [matcherPage, resultPage, aboutPage, contributorsPage].forEach(page => {
      page.classList.toggle("visible", page.id === pageId);
    });
    if (pageId === "matcherPage" && !keepResults) {
      matcherPage.classList.remove("showing-results");
    }
    if (updateHash && pageHashMap[pageId]) {
      history.pushState(null, "", `#${pageHashMap[pageId]}`);
      sessionStorage.setItem("resumePilotPage", pageId);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showPageReplace(pageId, updateHash = true, keepResults = false) {
    landingPage.style.display = "none";
    [matcherPage, resultPage, aboutPage, contributorsPage].forEach(page => {
      page.classList.toggle("visible", page.id === pageId);
    });
    if (pageId === "matcherPage" && !keepResults) {
      matcherPage.classList.remove("showing-results");
    }
    if (updateHash && pageHashMap[pageId]) {
      history.replaceState(null, "", `#${pageHashMap[pageId]}`);
      sessionStorage.setItem("resumePilotPage", pageId);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function restorePageState() {
    const hash = window.location.hash.replace("#", "");
    
    // If no hash, show landing page and clear results
    if (!hash) {
      hasValidResults = false;
      resultPageContent.innerHTML = "";
      landingPage.style.display = "block";
      [matcherPage, resultPage, aboutPage, contributorsPage].forEach(page => {
        page.classList.toggle("visible", false);
      });
      return;
    }
    
    // Otherwise use hash to show the page
    const pageToShow = hashPageMap[hash];
    if (pageToShow && [matcherPage.id, resultPage.id, aboutPage.id, contributorsPage.id].includes(pageToShow)) {
      // Don't show results if accessed via history without fresh data
      if (pageToShow === "resultPage" && !hasValidResults) {
        hasValidResults = false;
        resultPageContent.innerHTML = "";
        return;
      }
      showPage(pageToShow, false);
    }
  }

  restorePageState();

  window.addEventListener('popstate', restorePageState);
  window.addEventListener('hashchange', restorePageState);

  openMatcherBtn.addEventListener("click", () => {
    showPage("matcherPage");
  });

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", () => {
      showPage(button.dataset.page);
    });
  });

  analyzeBtn.addEventListener("click", analyze);

  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("resumeFile");
  const fileName  = document.getElementById("fileName");

  fileInput.addEventListener("change", () => {
    fileName.textContent = fileInput.files[0]?.name || "";
  });
  dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("drag-over"); });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    if (e.dataTransfer.files[0]) {
      fileInput.files = e.dataTransfer.files;
      fileName.textContent = e.dataTransfer.files[0].name;
    }
  });

  async function analyze(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.returnValue = false;
    }

    const btn   = document.getElementById("analyzeBtn");
    const errEl = document.getElementById("errorMsg");
    const statusEl = document.getElementById("statusMsg");
    errEl.classList.remove("visible");
    statusEl.classList.remove("visible");
    statusEl.textContent = "";

    const jt   = document.getElementById("jobTitle").value.trim();
    const jd   = document.getElementById("jobDescription").value.trim();
    const file = fileInput.files[0];

    if (!jt || !jd || !file) {
      showError("Please fill in all three fields before analyzing.");
      return;
    }

    btn.disabled = true;
    btn.innerHTML = `<div class="spinner"></div> Analyzing...`;
    showStatus("Sending resume to backend...");

    const form = new FormData();
    form.append("resume", file);
    form.append("job_description", jd);
    form.append("job_title", jt);

    let data;

    try {
      const res  = await fetch(`${API_BASE}/analyze`, { method: "POST", body: form });
      const raw = await res.text();
      showStatus(`Backend responded with ${res.status}. Opening results...`);
      data = raw ? JSON.parse(raw) : {};

      if (!res.ok) {
        showError(data.Error || data.error || `Server returned ${res.status}.`);
        return;
      }
    } catch (err) {
      console.error("Analyze request failed:", err);
      showError("Could not reach the server. Make sure the backend is running.");
      return;
    }

    try {
      if (data.Error || data.error) {
        showError(formatMessage(data.Error || data.error));
        return;
      }
      openResultPage(`<div class="results-loading">Preparing your results...</div>`);
      renderResults(data);
    } catch (err) {
      matcherPage.classList.remove("showing-results");
      console.error("Could not render analysis results:", err, data);
      openResultPage(`
        <div class="results-render-error">
          Analysis finished, but the detailed cards could not be shown.
          <br><br>
          Backend response:
          <pre style="white-space:pre-wrap;margin-top:10px;font:12px/1.5 monospace;color:#526897;">${escapeHtml(JSON.stringify(data, null, 2))}</pre>
        </div>
      `);
    } finally {
      btn.disabled = false;
      btn.innerHTML = "Analyze Resume";
    }
  }

  function showError(msg) {
    const el = document.getElementById("errorMsg");
    el.textContent = formatMessage(msg);
    el.classList.add("visible");
  }

  function showStatus(msg) {
    const el = document.getElementById("statusMsg");
    el.textContent = msg;
    el.classList.add("visible");
  }

  function openResultPage(html) {
    resultPageContent.innerHTML = html;
    showPageReplace("resultPage", true, true);
  }

  function renderResults(d) {
    hasValidResults = true;
    const resultsEl = document.getElementById("results");
    resultPageContent.innerHTML = "";
    resultPageContent.appendChild(resultsEl);
    showPageReplace("resultPage", true, true);
    resultsEl.classList.add("visible");
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const score = d.ats_score ?? 0;
    const circ  = 226.2;
    const offset = circ - (score / 100) * circ;
    const circle = document.getElementById("scoreCircle");
    circle.style.strokeDashoffset = offset;
    circle.style.stroke = score >= 70 ? "#22c55e" : score >= 45 ? "#eab308" : "#ef4444";

    const numEl = document.getElementById("scoreNum");
    let cur = 0;
    const step = score / 40;
    const timer = setInterval(() => {
      cur = Math.min(cur + step, score);
      numEl.textContent = Math.round(cur);
      if (cur >= score) clearInterval(timer);
    }, 25);

    const hl = document.getElementById("scoreHeadline");
    const sub = document.getElementById("scoreSub");
    if (score >= 70) {
      hl.textContent = "Strong match";
      sub.textContent = "Your resume is well-aligned with this role.";
    } else if (score >= 45) {
      hl.textContent = "Moderate match";
      sub.textContent = "A few targeted improvements will push you higher.";
    } else {
      hl.textContent = "Needs work";
      sub.textContent = "Your resume needs significant tailoring for this role.";
    }

    const wcCard  = document.getElementById("wordCountCard");
    const jtCard  = document.getElementById("jobTitleCard");
    const ghCard  = document.getElementById("githubCard");
    const wcText  = document.getElementById("wordCountText");
    const jtText  = document.getElementById("jobTitleText");
    const ghText  = document.getElementById("githubText");
    wcText.textContent = d.word_count || "-";
    jtText.textContent = d.job_title_match || "-";
    ghText.textContent = d.github || "-";
    wcCard.className = "info-card " + (d.word_count?.includes("within") ? "ok" : "warn");
    jtCard.className = "info-card " + (d.job_title_match?.includes("aligns") ? "ok" : "warn");
    ghCard.className = "info-card " + (d.github?.includes("No GitHub") ? "warn" : "ok");

    document.getElementById("feedbackText").textContent = d.feedback || "-";

    const hardEl = document.getElementById("hardChips");
    hardEl.innerHTML = "";
    toList(d.hard_skills_match).forEach(k => hardEl.innerHTML  += chip(k, "match"));
    toList(d.hard_skills_missing).forEach(k => hardEl.innerHTML  += chip(k, "missing"));

    const softEl = document.getElementById("softChips");
    softEl.innerHTML = "";
    toList(d.soft_skills_match).forEach(k => softEl.innerHTML  += chip(k, "match"));
    toList(d.soft_skills_missing).forEach(k => softEl.innerHTML  += chip(k, "missing"));

    const weakBlock = document.getElementById("weakBlock");
    const weakChips = document.getElementById("weakChips");
    const weakSections = toList(d.weak_sections);
    if (weakSections.length) {
      weakBlock.style.display = "block";
      weakChips.innerHTML = weakSections.map(s => chip(s, "weak")).join("");
    } else {
      weakBlock.style.display = "none";
    }

    const sugEl = document.getElementById("suggestionsList");
    sugEl.innerHTML = toList(d.suggestions).map(s => `<li>${s}</li>`).join("");
  }

  function toList(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    return [value];
  }

  function formatMessage(value) {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.join(", ");
    if (value && typeof value === "object") return Object.values(value).join(", ") || JSON.stringify(value);
    return String(value || "");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function chip(text, type) {
    return `<span class="chip ${type}">${text}</span>`;
  }
