import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./lib/supabaseClient";

const API_BASE = (
  (window.ENV_API_URL || import.meta.env.VITE_API_URL || "").replace(/\/$/, "")
) || "https://atsresumematcher-production.up.railway.app";

// â”€â”€ FIX 1: added "historyPage" to both maps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const pageHashMap = {
  matcherPage:      "matcher",
  resultPage:       "results",
  aboutPage:        "about",
  contributorsPage: "contributors",
  loginPage:        "login",
  signupPage:       "signup",
  historyPage:      "history",
  jobsPage:         "jobs",   // â† NEW
};

const hashPageMap = {
  matcher:      "matcherPage",
  results:      "resultPage",
  about:        "aboutPage",
  contributors: "contributorsPage",
  login:        "loginPage",
  signup:       "signupPage",
  history:      "historyPage",
  jobs:         "jobsPage",   // â† NEW
};

function pageFromHash(hasResults, session = null, authReady = true) {
  const hash = window.location.hash.replace("#", "");
  if (!hash) return "landingPage";
  const page = hashPageMap[hash] || "landingPage";
  if (!authReady) return page;
  if (session && (page === "loginPage" || page === "signupPage")) return "matcherPage";
  if (!session && isProtectedPage(page)) return "loginPage";
  if (page === "resultPage" && !hasResults) return "matcherPage";
  return page;
}

const PUBLIC_PAGES = new Set(["landingPage", "loginPage", "signupPage"]);

function isProtectedPage(pageId) {
  return !PUBLIC_PAGES.has(pageId);
}
function toList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function formatMessage(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object")
    return Object.values(value).join(", ") || JSON.stringify(value);
  return String(value || "");
}


function readStoredJobs() {
  try {
    return JSON.parse(sessionStorage.getItem("resumePilotJobs") || "[]");
  } catch {
    return [];
  }
}

function readStoredJobError() {
  return sessionStorage.getItem("resumePilotJobError") || "";
}
function scoreTone(score) {
  if (score >= 70)
    return { headline: "Strong match",    sub: "Your resume is well-aligned with this role.",             color: "#22c55e" };
  if (score >= 45)
    return { headline: "Moderate match",  sub: "A few targeted improvements will push you higher.",       color: "#eab308" };
  return   { headline: "Needs work",      sub: "Your resume needs significant tailoring for this role.",  color: "#ef4444" };
}

// â”€â”€ auth helper â€” get current session token â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// â”€â”€ Nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Nav({ activePage, onNavigate, session }) {
  const protectedItems = [
    ["matcherPage", "ResumePilot"],
    ["aboutPage", "About ResumePilot"],
    ["contributorsPage", "Contributors"],
  ];

  return (
    <nav className="top-nav" aria-label="Primary navigation">
      {session ? (
        <>
          {protectedItems.map(([page, label]) => (
            <button
              key={page}
              className={`nav-btn ${
                activePage === page ||
                (activePage === "resultPage" && page === "matcherPage")
                  ? "active"
                  : ""
              }`}
              type="button"
              onClick={() => onNavigate(page)}
            >
              {label}
            </button>
          ))}
          <button
            className={`nav-btn ${activePage === "historyPage" ? "active" : ""}`}
            type="button"
            onClick={() => onNavigate("historyPage")}
          >
            My History
          </button>
          <button
            className="nav-btn"
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              onNavigate("landingPage");
            }}
          >
            Log Out
          </button>
        </>
      ) : (
        <>
          <button
            className={`nav-btn ${activePage === "landingPage" ? "active" : ""}`}
            type="button"
            onClick={() => onNavigate("landingPage")}
          >
            Home
          </button>
          <button
            className={`nav-btn ${activePage === "loginPage" ? "active" : ""}`}
            type="button"
            onClick={() => onNavigate("loginPage")}
          >
            Log In
          </button>
          <button
            className={`nav-btn ${activePage === "signupPage" ? "active" : ""}`}
            type="button"
            onClick={() => onNavigate("signupPage")}
          >
            Sign Up
          </button>
        </>
      )}
    </nav>
  );
}

function Header({ activePage, onNavigate, session }) {
  return (
    <header>
      <h1>
        Resume<span className="logo-pink">Pilot</span>
      </h1>
      <Nav activePage={activePage} onNavigate={onNavigate} session={session} />
    </header>
  );
}

// â”€â”€ Landing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LandingPage({ onStart, onNavigate, session }) {
  return (
    <section className="page-shell" id="landingPage">
      <div className="landing-auth-bar" aria-label="Account actions">
        {session ? (
          <>
            <button
              className="landing-auth-btn ghost"
              type="button"
              onClick={() => onNavigate("historyPage")}
            >
              My History
            </button>
            <button
              className="landing-auth-btn filled"
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
              }}
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <button
              className="landing-auth-btn ghost"
              type="button"
              onClick={() => onNavigate("loginPage")}
            >
              Login
            </button>
            <button
              className="landing-auth-btn filled"
              type="button"
              onClick={() => onNavigate("signupPage")}
            >
              Sign Up
            </button>
          </>
        )}
      </div>
      <div className="landing">
        <div className="landing-copy">
          <h1>ResumePilot</h1>
          <div className="tagline">Score Higher. Get Hired.</div>
          <p className="intro">
            Optimize your resume for Applicant Tracking Systems and increase
            your chances of getting noticed by recruiters.
          </p>
          <div className="cta-row">
            <button
              className="btn-primary"
              id="openMatcherBtn"
              type="button"
              onClick={session ? onStart : () => onNavigate("loginPage")}
            >
              <span className="btn-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3v12m0-12 4 4m-4-4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              {session ? "Upload Resume" : "Log In to Upload"}
            </button>
            <div className="hand-note" aria-hidden="true">
              <svg viewBox="0 0 100 58">
                <path d="M94 24c-16 22-43 18-53 4" />
                <path d="M42 30c8-14 18 10 4 11-13 1-18-12-16-18" />
                <path d="M22 24c-6 1-11 0-17-4" />
              </svg>
              <span>Get instant ATS score and expert suggestions!</span>
            </div>
          </div>
          <div className="feature-strip" aria-label="Highlights">
            <Feature title="ATS Friendly"    text="Pass ATS checks with ease"                   icon="document" />
            <Feature title="Improve Score"   text="Get personalized recommendations"            icon="chart"    />
            <Feature title="Land Interviews" text="Increase your chances of getting hired"      icon="profile"  />
          </div>
        </div>
        <HeroArt />
      </div>
    </section>
  );
}

function Feature({ title, text, icon }) {
  return (
    <div className="feature">
      {icon === "document" && (
        <svg className="feature-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path d="M18 8h21l9 9v37H18z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M39 8v10h10M25 29h14M25 37h9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="45" cy="44" r="9" stroke="currentColor" strokeWidth="2.5" />
          <path d="m41 44 3 3 6-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {icon === "chart" && (
        <svg className="feature-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path d="M12 52h40M16 52V34h9v18M29 52V26h9v26M42 52V18h9v34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 25c10-1 18-8 24-16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="45" cy="10" r="4" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      )}
      {icon === "profile" && (
        <svg className="feature-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <circle cx="32" cy="31" r="24" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="32" cy="25" r="7"  stroke="currentColor" strokeWidth="2.5" />
          <path d="M18 47c4-8 23-8 28 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="orbit"></div>
      <div className="check-badge">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <svg className="target-badge" viewBox="0 0 96 96" fill="none">
        <circle cx="43" cy="49" r="25" stroke="currentColor" strokeWidth="4" />
        <circle cx="43" cy="49" r="13" stroke="currentColor" strokeWidth="4" />
        <path d="M43 49 74 18M70 15l8-2-2 8M78 13l5-5M74 18h9M74 18v-9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="resume-card">
        <div className="mock-title">Your Resume</div>
        <div className="profile-row">
          <div className="avatar"></div>
          <div className="line-stack">
            <span className="mock-line"></span>
            <span className="mock-line"></span>
            <span className="mock-line"></span>
          </div>
        </div>
        <MockSection title="Work Experience" widths={["82%", "64%", "72%"]} />
        <MockSection title="Education"       widths={["74%", "56%", "66%"]} />
        <div className="mock-section">
          <h4>Skills</h4>
          <div className="skill-pills">
            {["70px","62px","56px","64px","48px","66px"].map((w) => (
              <span key={w} style={{ "--w": w }}></span>
            ))}
          </div>
        </div>
      </div>
      <div className="score-card">
        <h3>ResumePilot Score</h3>
        <div className="hero-score-ring">
          <div>
            <strong>92%</strong>
            <span>Excellent Match!</span>
          </div>
        </div>
        <div className="match-label">Excellent Match!</div>
        <ul className="match-list">
          <li>Keywords Matched</li>
          <li>Skills Found</li>
          <li>Format Friendly</li>
          <li>Content Quality</li>
        </ul>
      </div>
      <div className="suggestion-card">
        <h3>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 18h6M10 22h4M8 14c-1.9-1.3-3-3.3-3-5.6C5 4.9 8.1 2 12 2s7 2.9 7 6.4c0 2.3-1.1 4.3-3 5.6-.8.5-1 1.2-1 2H9c0-.8-.2-1.5-1-2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Top Suggestions
        </h3>
        <div className="pink-lines">
          {["85%","66%","92%"].map((w) => (
            <span key={w} style={{ "--w": w }}></span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockSection({ title, widths }) {
  return (
    <div className="mock-section">
      <h4>{title}</h4>
      {widths.map((w) => (
        <div className="mock-bullet" key={w}>
          <span style={{ "--w": w }}></span>
        </div>
      ))}
    </div>
  );
}

// â”€â”€ Matcher â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MatcherPage({ activePage, onNavigate, resultData, onResult, onResultLoading, session }) {
  const [jobTitle,        setJobTitle]        = useState("");
  const [jobDescription,  setJobDescription]  = useState("");
  const [file,            setFile]            = useState(null);
  const [isDragging,      setIsDragging]      = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [status,          setStatus]          = useState("");
  const [error,           setError]           = useState("");
  const fileInputRef = useRef(null);

  async function analyze(event) {
    event.preventDefault();
    setError("");
    setStatus("");

    // â”€â”€ FIX 2: auth guard â€” redirect to login if not logged in â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (!session) {
      onNavigate("loginPage");
      return;
    }

    if (!jobTitle.trim() || !jobDescription.trim() || !file) {
      setError("Please fill in all three fields before analyzing.");
      return;
    }

    setLoading(true);
    setStatus("Sending resume to backend...");

    const form = new FormData();
    form.append("resume",          file);
    form.append("job_description", jobDescription.trim());
    form.append("job_title",       jobTitle.trim());

    try {
      // â”€â”€ FIX 3: attach JWT so backend can authenticate the user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const token = await getToken();
      const response = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body:   form,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const raw  = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      setStatus(`Backend responded with ${response.status}. Opening results...`);

      if (!response.ok) {
        setError(formatMessage(data.Error || data.error || `Server returned ${response.status}.`));
        return;
      }
      if (data.Error || data.error) {
        setError(formatMessage(data.Error || data.error));
        return;
      }

      onResultLoading();
      onResult(data);
    } catch (err) {
      console.error("Analyze request failed:", err);
      setError("Could not reach the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(event) {
    setFile(event.target.files?.[0] || null);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) return;
    setFile(droppedFile);
    if (fileInputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(droppedFile);
      fileInputRef.current.files = dt.files;
    }
  }

  return (
    <section
      className={`matcher-page ${activePage === "matcherPage" ? "visible" : ""}`}
      id="matcherPage"
    >
      <Header activePage={activePage} onNavigate={onNavigate} session={session} />
      <main>
        <div className="hero">
          <h2>
            See how your resume<br />scores against any <em>JD</em>
          </h2>
          <p>
            Upload your resume, paste the job description, and get a detailed
            ATS analysis in seconds.
          </p>
        </div>

        <form className="form-panel" onSubmit={analyze}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="jobTitle">Job Title</label>
              <input
                type="text"
                id="jobTitle"
                placeholder="e.g. Junior Backend Developer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="resumeFile">Resume (PDF)</label>
              <div
                className={`drop-zone ${isDragging ? "drag-over" : ""}`}
                id="dropZone"
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="resumeFile"
                  accept=".pdf"
                  title="Upload resume PDF"
                  onChange={handleFileChange}
                />
                <div className="drop-zone-content">
                  <span className="icon" aria-hidden="true">
                    <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                      <path d="M14 2v6h6M12 12v6m0-6-3 3m3-3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div className="hint">Click or drag your PDF here</div>
                  <div className="file-name" id="fileName">{file?.name || ""}</div>
                </div>
              </div>
            </div>

            <div className="field full">
              <label htmlFor="jobDescription">Job Description</label>
              <textarea
                id="jobDescription"
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn-analyze"
            id="analyzeBtn"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <><div className="spinner"></div> Analyzing...</>
            ) : session ? (
              "Analyze Resume"
            ) : (
              "Log In to Analyze"
            )}
          </button>

          <div className={`status-msg ${status ? "visible" : ""}`} id="statusMsg">{status}</div>
          <div className={`error-msg ${error  ? "visible" : ""}`} id="errorMsg">{error}</div>
        </form>

        <hr className="divider" />
        <Results data={resultData} />
      </main>
    </section>
  );
}

// â”€â”€ Result page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ResultPage({ activePage, onNavigate, resultData, renderError, session, jobData, jobError }) {
  return (
    <section
      className={`result-page ${activePage === "resultPage" ? "visible" : ""}`}
      id="resultPage"
    >
      <Header activePage={activePage} onNavigate={onNavigate} session={session} />
      <main className="result-content" id="resultPageContent">
        {renderError ? (
          <div className="results-render-error">{renderError}</div>
        ) : resultData ? (
          <>
            <Results data={resultData} visible />
          </>
        ) : (
          <div className="results-loading">Preparing your results...</div>
        )}
      </main>
    </section>
  );
}

// â”€â”€ Results component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Results({ data, visible = false }) {
  const score        = data?.ats_score ?? 0;
  const tone         = scoreTone(score);
  const circumference = 226.2;
  const offset       = circumference - (score / 100) * circumference;
  const weakSections = toList(data?.weak_sections);

  return (
    <section id="results" className={visible || data ? "visible" : ""}>
      <div className="results-header">
        <div className="score-ring">
          <svg viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="36" fill="none" stroke="#e4ecfb" strokeWidth="7" />
            <circle
              id="scoreCircle"
              cx="44" cy="44" r="36"
              fill="none"
              stroke={tone.color}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s ease, stroke 0.3s" }}
            />
          </svg>
          <div className="score-text">
            <span className="score-num" id="scoreNum">{Math.round(score)}</span>
            <span className="score-label">ATS Score</span>
          </div>
        </div>
        <div className="results-header-text">
          <h3 id="scoreHeadline">{data ? tone.headline : "-"}</h3>
          <p  id="scoreSub">{data ? tone.sub : "-"}</p>
        </div>
      </div>

      <div className="cards-row">
        {/* â”€â”€ FIX 1: corrected all six field names â”€â”€ */}
        <InfoCard
          label="Word Count"
          value={data?.word_count_feedback || "-"}
          className={data?.word_count_feedback?.toLowerCase().includes("within") ? "ok" : "warn"}
        />
        <InfoCard
          label="Job Title Match"
          value={data?.job_title_match || "-"}
          className={data?.job_title_match?.toLowerCase().includes("aligns") ? "ok" : "warn"}
        />
        <InfoCard
          label="GitHub Profile"
          value={data?.github_status || "-"}
          className={data?.github_status?.toLowerCase().includes("no github") ? "warn" : "ok"}
        />
      </div>

      <SectionBlock color="#4f7cff" title="Overall Feedback">
        <p id="feedbackText">{data?.feedback || "-"}</p>
      </SectionBlock>

      <SectionBlock color="#22c55e" title="Hard Skills">
        <div className="chips" id="hardChips">
          {toList(data?.matched_hard_skills).map((item) => (
            <Chip key={`hard-match-${item}`}   type="match"   text={item} />
          ))}
          {toList(data?.missing_hard_skills).map((item) => (
            <Chip key={`hard-missing-${item}`} type="missing" text={item} />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock color="#a78bfa" title="Soft Skills">
        <div className="chips" id="softChips">
          {toList(data?.matched_soft_skills).map((item) => (
            <Chip key={`soft-match-${item}`}   type="match"   text={item} />
          ))}
          {toList(data?.missing_soft_skills).map((item) => (
            <Chip key={`soft-missing-${item}`} type="missing" text={item} />
          ))}
        </div>
      </SectionBlock>

      {weakSections.length > 0 && (
        <SectionBlock color="#eab308" title="Weak Sections">
          <div className="chips" id="weakChips">
            {weakSections.map((item) => (
              <Chip key={`weak-${item}`} type="weak" text={item} />
            ))}
          </div>
        </SectionBlock>
      )}

      <SectionBlock color="#f97316" title="Suggestions to Improve">
        <ul className="suggestions-list" id="suggestionsList">
          {toList(data?.suggestions).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </SectionBlock>
    </section>
  );
}

function InfoCard({ label, value, className }) {
  return (
    <div className={`info-card ${className}`}>
      <div className="card-label">{label}</div>
      <span>{value}</span>
    </div>
  );
}

function SectionBlock({ color, title, children }) {
  return (
    <div className="section-block">
      <h4><span className="dot" style={{ background: color }}></span>{title}</h4>
      {children}
    </div>
  );
}

function Chip({ text, type }) {
  return <span className={`chip ${type}`}>{text}</span>;
}

// â”€â”€ Simple page shell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SimplePage({ id, title, activePage, onNavigate, session, children }) {
  return (
    <section
      className={`simple-page ${activePage === id ? "visible" : ""}`}
      id={id}
    >
      <Header activePage={activePage} onNavigate={onNavigate} session={session} />
      <main className="simple-content">
        <h2>{title}</h2>
        <div className="editable-copy">{children}</div>
      </main>
    </section>
  );
}

// â”€â”€ About â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AboutPage(props) {
  return (
    <SimplePage id="aboutPage" title="About ResumePilot" {...props}>
      <h1>
        <a
          href="https://github.com/subhamdas29/ATS_resume_matcher"
          target="_blank" rel="noopener noreferrer"
          style={{ textDecoration: "underline", color: "inherit" }}
        >
          ResumePilot
        </a>
      </h1>
      <p>
        <strong>ResumePilot</strong> is a smart ATS (Applicant Tracking System)
        score checker that scans your resume and gives a detailed analysis based
        on your resume, a job description, and a target job role, helping you
        understand exactly where you stand before applying.
      </p>
      <hr style={{ margin: "60px 0 40px 0" }} />
      <h2>What It Does</h2>
      <ul>
        <li><strong>ATS Score</strong> â€” a blended score calculated using semantic similarity, keyword matching, section quality, and job title alignment</li>
        <li><strong>Hard & Soft Skill Analysis</strong> â€” shows which skills from the job description are present in your resume and which are missing</li>
        <li><strong>Keyword Expansion</strong> â€” if your resume mentions <em>data analyst</em>, ResumePilot infers related skills like <em>numpy</em> and <em>matplotlib</em> even if they are not explicitly listed</li>
        <li><strong>Weak Section Detection</strong> â€” flags resume sections that need improvement</li>
        <li><strong>Overall Feedback & Suggestions</strong> â€” actionable recommendations tailored to your resume and the job description</li>
        <li><strong>GitHub Profile Analysis</strong> â€” detects GitHub links in your resume, scans profile activity, and factors it into your overall score</li>
        <li><strong>Word Count Check</strong> â€” tells you if your resume is too short, too long, or within the ideal 400â€“800 word range</li>
      </ul>
      <hr style={{ margin: "60px 0 40px 0" }} />
      <h2>How the ATS Score Is Calculated</h2>
      <div style={{ background: "#f5f5f5", padding: "15px", borderRadius: "5px", fontFamily: "monospace", lineHeight: 1.8 }}>
        <div><strong>ATS Score =</strong></div>
        <div style={{ marginLeft: "20px" }}>
          <div>Section Score Average Ã— 0.28</div>
          <div>Hard Skill Match      Ã— 0.35</div>
          <div>Semantic Similarity   Ã— 0.15</div>
          <div>Soft Skill Match      Ã— 0.07</div>
          <div>Job Title Match       Ã— 0.05</div>
          <div>GitHub Score          Ã— 0.10</div>
        </div>
      </div>
    </SimplePage>
  );
}

// â”€â”€ Contributors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const contributors = [
  ["Subham Das",         "Backend Developer", "Designed and built the backend pipeline, including FastAPI, PDF parsing, GitHub profile analysis, and the end-to-end /analyze endpoint.",                                "https://github.com/subhamdas29",  "https://linkedin.com/in/subhamdas29"],
  ["Rivo Khara",         "Backend Developer", "Implemented the ATS scoring algorithm, Groq-powered keyword extraction and expansion, and HuggingFace semantic similarity scoring.",                                   "https://github.com/RivoKhara",    "https://www.linkedin.com/in/rivo-khara-9966002b7/"],
  ["Sushobhan Biswas",   "Role/Position",     "Brief bio or contribution description", "https://github.com/USERNAME3", "https://linkedin.com/in/USERNAME3"],
  ["Arghyodeep Samanta", "Role/Position",     "Brief bio or contribution description", "https://github.com/USERNAME4", "https://linkedin.com/in/USERNAME4"],
  ["Sovan Lal Ganguly",  "Role/Position",     "Brief bio or contribution description", "https://github.com/USERNAME5", "https://linkedin.com/in/USERNAME5"],
];

function ContributorsPage(props) {
  return (
    <SimplePage id="contributorsPage" title="Contributors" {...props}>
      <h1>Meet the Team</h1>
      <p>ResumePilot is built and maintained by passionate developers and designers.</p>
      <hr />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px", margin: "30px 0" }}>
        {contributors.map(([name, role, bio, github, linkedin]) => (
          <div key={name} style={{ textAlign: "center", padding: "20px", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
            <h3 style={{ margin: "15px 0", fontSize: "24px" }}>{name}</h3>
            <p style={{ color: "#666", margin: "10px 0" }}>{role}</p>
            <p style={{ fontSize: "14px", color: "#888", margin: "10px 0" }}>{bio}</p>
            <div style={{ marginTop: "15px", display: "flex", justifyContent: "center", gap: "15px" }}>
              <a href={github}   target="_blank" rel="noopener noreferrer" className="social-link github-link"   title="GitHub Profile">GH</a>
              <a href={linkedin} target="_blank" rel="noopener noreferrer" className="social-link linkedin-link" title="LinkedIn Profile">in</a>
            </div>
          </div>
        ))}
      </div>
    </SimplePage>
  );
}

// â”€â”€ Auth shell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AuthShell({ activePage, onNavigate, session, mode, title, subtitle, children, footer }) {
  return (
    <section
      className={`auth-page ${activePage === `${mode}Page` ? "visible" : ""}`}
      id={`${mode}Page`}
    >
      <Header activePage={activePage} onNavigate={onNavigate} session={session} />
      <main className="auth-content">
        <div className="auth-panel">
          <div className="auth-copy">
            <span className="auth-kicker">ResumePilot Account</span>
            <h2>{title}</h2>
            <p>{subtitle}</p>
            <div className="auth-mini-card">
              <strong>ATS-ready workflow</strong>
              <span>Keep your resume checks organized with your personal score history.</span>
            </div>
          </div>
          <div className="auth-form-card">
            {children}
            {footer}
          </div>
        </div>
      </main>
    </section>
  );
}

// â”€â”€ FIX 2: Login with real Supabase auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LoginPage(props) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [message,  setMessage]  = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // onAuthStateChange in App will update session and move away from the auth URL.
    window.history.replaceState(null, "", "#matcher");
    setLoading(false);
  }

  return (
    <AuthShell
      {...props}
      mode="login"
      title="Welcome back"
      subtitle="Sign in to continue your resume analysis flow."
      footer={
        <p className="auth-switch">
          New to ResumePilot?{" "}
          <button type="button" onClick={() => props.onNavigate("signupPage")}>
            Create an account
          </button>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleLogin}>
        <label htmlFor="loginEmail">Email</label>
        <input
          id="loginEmail" type="email" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)} required
        />

        <label htmlFor="loginPassword">Password</label>
        <input
          id="loginPassword" type="password" placeholder="Enter your password"
          value={password} onChange={(e) => setPassword(e.target.value)} required
        />

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {message && <div className="auth-message error">{message}</div>}
      </form>
    </AuthShell>
  );
}

// â”€â”€ FIX 2: Signup with real Supabase auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SignupPage(props) {
  const [form,    setForm]    = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSignup(event) {
    event.preventDefault();
    setMessage({ text: "", type: "" });

    if (form.password !== form.confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email:    form.email,
      password: form.password,
      options:  {
        data: { full_name: form.name },
        emailRedirectTo: `${window.location.origin}${window.location.pathname}#login`,
      },
    });

    if (error) {
      setMessage({ text: error.message, type: "error" });
      setLoading(false);
      return;
    }

    setMessage({
      text: "Account created! Check your email to confirm, then log in.",
      type: "success",
    });
    setLoading(false);
  }

  return (
    <AuthShell
      {...props}
      mode="signup"
      title="Create your account"
      subtitle="Start analysing your resume and track your progress over time."
      footer={
        <p className="auth-switch">
          Already have an account?{" "}
          <button type="button" onClick={() => props.onNavigate("loginPage")}>
            Login
          </button>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSignup}>
        <label htmlFor="signupName">Full Name</label>
        <input
          id="signupName" type="text" placeholder="Your name"
          value={form.name} onChange={(e) => updateField("name", e.target.value)} required
        />

        <label htmlFor="signupEmail">Email</label>
        <input
          id="signupEmail" type="email" placeholder="you@example.com"
          value={form.email} onChange={(e) => updateField("email", e.target.value)} required
        />

        <label htmlFor="signupPassword">Password</label>
        <input
          id="signupPassword" type="password" placeholder="Min. 6 characters"
          value={form.password} onChange={(e) => updateField("password", e.target.value)}
          required minLength={6}
        />

        <label htmlFor="signupConfirmPassword">Retype Password</label>
        <input
          id="signupConfirmPassword" type="password" placeholder="Retype your password"
          value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} required
        />

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        {message.text && (
          <div className={`auth-message ${message.type}`}>{message.text}</div>
        )}
      </form>
    </AuthShell>
  );
}

// â”€â”€ FIX 4: History page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function HistoryPage({ activePage, onNavigate, session }) {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (activePage !== "historyPage") return;
    if (!session) {
      onNavigate("loginPage");
      return;
    }
    fetchHistory();
  }, [activePage, session]);

  async function fetchHistory() {
    setLoading(true);
    setHistoryError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("You are not logged in. Please log in again.");

      const resp = await fetch(`${API_BASE}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(formatMessage(data.detail || data.Error || data.error || `History request failed (${resp.status}).`));
      }

      setAnalyses(Array.isArray(data.analyses) ? data.analyses : []);
    } catch (e) {
      console.error("History fetch failed:", e);
      setHistoryError(e.message || "History fetch failed.");
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(id) {
    setModalOpen(true);
    setSelected(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("You are not logged in. Please log in again.");

      const resp = await fetch(`${API_BASE}/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(formatMessage(data.detail || data.Error || data.error || `Scorecard request failed (${resp.status}).`));
      }
      setSelected(data);
    } catch (e) {
      console.error("Scorecard fetch failed:", e);
      setSelected({ error: e.message || "Could not load scorecard." });
    }
  }

  function scoreColor(s) {
    if (s >= 75) return "#22c55e";
    if (s >= 50) return "#eab308";
    return "#ef4444";
  }

  return (
    <section
      className={`simple-page ${activePage === "historyPage" ? "visible" : ""}`}
      id="historyPage"
    >
      <Header activePage={activePage} onNavigate={onNavigate} session={session} />
      <main className="simple-content">
        <h2>My Score History</h2>
        <p style={{ color: "#888", fontSize: "12px", marginTop: "-8px" }}>
          Backend: {API_BASE}
        </p>

        {loading && <p style={{ color: "#888" }}>Loading your analyses...</p>}

        {historyError && (
          <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c", borderRadius: "10px", padding: "14px 16px", marginTop: "18px", fontWeight: 700 }}>
            {historyError}
          </div>
        )}

        {!loading && !historyError && analyses.length === 0 && (
          <p style={{ color: "#888" }}>
            No analyses yet.{" "}
            <button
              type="button"
              onClick={() => onNavigate("matcherPage")}
              style={{ color: "#ec6ead", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
              Run your first one
            </button>
          </p>
        )}

        {!loading && !historyError && analyses.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "24px" }}>
            {analyses.map((a) => (
              <div
                key={a.id}
                onClick={() => openDetail(a.id)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px",
                  padding: "18px 24px", cursor: "pointer", transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#ec6ead"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "16px" }}>{a.job_title || "Untitled"}</div>
                  <div style={{ fontSize: "13px", color: "#888", marginTop: "3px" }}>
                    {a.created_at ? new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Saved analysis"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "32px", fontWeight: 900, color: scoreColor(a.ats_score) }}>
                    {a.ats_score ?? "--"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#888" }}>ATS Score</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 999, padding: "24px",
          }}
        >
          <div style={{
            background: "#fff", borderRadius: "14px", padding: "36px 40px",
            width: "100%", maxWidth: "680px", maxHeight: "85vh", overflowY: "auto",
            position: "relative",
          }}>
            <button
              onClick={() => setModalOpen(false)}
              style={{ position: "absolute", top: "16px", right: "20px", background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#888" }}
            >
              x
            </button>

            {!selected ? (
              <p>Loading scorecard...</p>
            ) : selected.error ? (
              <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c", borderRadius: "10px", padding: "14px 16px", fontWeight: 700 }}>
                {selected.error}
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "4px" }}>{selected.job_title || "Untitled"}</h3>
                <p style={{ color: "#888", fontSize: "13px", marginBottom: "24px" }}>
                  {selected.created_at ? new Date(selected.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Saved analysis"}
                </p>

                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                  <div style={{ fontSize: "72px", fontWeight: 900, color: scoreColor(selected.ats_score), lineHeight: 1 }}>
                    {selected.ats_score ?? "--"}
                  </div>
                  <div style={{ color: "#888", fontSize: "14px", marginTop: "4px" }}>ATS Score</div>
                </div>

                <Results data={selected} visible />
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
function JobSuggestions({ jobs }) {
  const [expanded, setExpanded] = useState(null);

  if (!jobs || jobs.length === 0) return null;

  function formatSalary(min, max) {
    if (!min && !max) return null;
    const fmt = (n) =>
      n >= 100000
        ? `₹${(n / 100000).toFixed(1)}L`
        : `₹${Math.round(n).toLocaleString("en-IN")}`;
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max)}`;
  }

  function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7)  return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }

  return (
    <div
      style={{
        marginTop: "40px",
        borderTop: "2px solid #e4ecfb",
        paddingTop: "32px",
      }}
    >
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: "#ec6ead",
            flexShrink: 0,
          }}
        />
        <h4
          style={{
            fontSize: "18px",
            fontWeight: 800,
            margin: 0,
            color: "#1a2430",
          }}
        >
          Relevant Jobs You Can Apply To
        </h4>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "12px",
            color: "#888",
            fontStyle: "italic",
          }}
        >
          Powered by Adzuna
        </span>
      </div>

      {/* job cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "16px",
        }}
      >
        {jobs.map((job) => {
          const salary = formatSalary(job.salary_min, job.salary_max);
          const isOpen = expanded === job.id;

          return (
            <div
              key={job.id}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxShadow: isOpen ? "0 4px 20px rgba(0,0,0,0.08)" : "none",
                borderColor: isOpen ? "#ec6ead" : "#e5e7eb",
              }}
            >
              {/* title + company */}
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "15px",
                    color: "#1a2430",
                    lineHeight: 1.35,
                    marginBottom: "4px",
                  }}
                >
                  {job.title}
                </div>
                <div style={{ fontSize: "13px", color: "#555", fontWeight: 600 }}>
                  {job.company}
                </div>
              </div>

              {/* meta row */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  fontSize: "12px",
                  color: "#777",
                }}
              >
                {job.location && (
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    📍 {job.location}
                  </span>
                )}
                {job.category && (
                  <span
                    style={{
                      background: "#f0f4ff",
                      color: "#4f7cff",
                      padding: "2px 8px",
                      borderRadius: "20px",
                      fontWeight: 600,
                    }}
                  >
                    {job.category}
                  </span>
                )}
                {timeAgo(job.created) && (
                  <span style={{ marginLeft: "auto" }}>{timeAgo(job.created)}</span>
                )}
              </div>

              {/* salary */}
              {salary && (
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#22c55e",
                  }}
                >
                  {salary} / year
                </div>
              )}

              {/* description toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : job.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#4f7cff",
                    fontSize: "12px",
                    cursor: "pointer",
                    padding: 0,
                    fontWeight: 600,
                  }}
                >
                  {isOpen ? "Hide description ▲" : "Show description ▼"}
                </button>

                {isOpen && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#555",
                      lineHeight: 1.6,
                      marginTop: "10px",
                      padding: "10px",
                      background: "#f9fafb",
                      borderRadius: "8px",
                    }}
                  >
                    {job.description}
                  </p>
                )}
              </div>

              {/* apply button */}
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  textAlign: "center",
                  background: "#ec6ead",
                  color: "#fff",
                  padding: "10px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "13px",
                  textDecoration: "none",
                  marginTop: "auto",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#d4579a")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#ec6ead")}
              >
                Apply Now →
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JobPortalSection({ activePage, onNavigate, session, jobData, jobError, jobLoading }) {
  if (activePage !== "resultPage" && activePage !== "jobsPage") return null;
  const jobsTouched = sessionStorage.getItem("resumePilotJobsTouched") === "true";

  return (
    <section className="simple-page visible" id="jobPortalSection">
      {activePage === "jobsPage" && <Header activePage={activePage} onNavigate={onNavigate} session={session} />}
      <main className="simple-content">
        <h2>Relevant Jobs You Can Apply To</h2>
        <p style={{ color: "#667085", marginTop: "-8px" }}>
          Curated from your resume analysis and matched skills.
        </p>

        {jobLoading && (
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px", marginTop: "20px", color: "#667085", fontWeight: 700 }}>
            Loading job suggestions...
          </div>
        )}

        {jobError && (
          <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c", borderRadius: "10px", padding: "14px 16px", marginTop: "20px", fontWeight: 700 }}>
            {jobError}
          </div>
        )}

        {!jobLoading && !jobError && jobsTouched && (!jobData || jobData.length === 0) && (
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px", marginTop: "20px", color: "#667085", fontWeight: 700 }}>
            No matching jobs found for this analysis yet.
          </div>
        )}

        {!jobLoading && !jobError && jobData && jobData.length > 0 && (
          <JobSuggestions jobs={jobData} />
        )}
      </main>
    </section>
  );
}
export default function App() {
  const [hasValidResults, setHasValidResults] = useState(false);
  const [activePage,      setActivePage]      = useState("landingPage");
  const [resultData,      setResultData]      = useState(null);
  const [renderError,     setRenderError]     = useState("");
  const [session,         setSession]         = useState(null);   // â† Supabase session
  const [authReady,       setAuthReady]       = useState(false);
  const [jobData, setJobData] = useState(readStoredJobs);
  const [jobError, setJobError] = useState(readStoredJobError);
  const [jobLoading, setJobLoading] = useState(false);
  // â”€â”€ listen for auth state changes (login / logout / token refresh) â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setActivePage(pageFromHash(hasValidResults, session, true));
    }).finally(() => setAuthReady(true));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthReady(true);
      setActivePage((currentPage) =>
        !session && isProtectedPage(currentPage)
          ? "landingPage"
          : pageFromHash(hasValidResults, session, true)
      );
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function restorePageState() {
      setActivePage(pageFromHash(hasValidResults, session, authReady));
    }
    window.addEventListener("popstate",   restorePageState);
    window.addEventListener("hashchange", restorePageState);
    return () => {
      window.removeEventListener("popstate",   restorePageState);
      window.removeEventListener("hashchange", restorePageState);
    };
  }, [hasValidResults, session, authReady]);


  function restoreStoredJobs() {
    const storedJobs = readStoredJobs();
    const storedJobError = readStoredJobError();
    setJobData(storedJobs);
    setJobError(storedJobError);
  }
  const navigate = useMemo(() => (pageId, replace = false) => {
    const targetPage = session && (pageId === "loginPage" || pageId === "signupPage")
      ? "matcherPage"
      : !session && isProtectedPage(pageId)
        ? "loginPage"
        : pageId;
    setActivePage(targetPage);
    const hash = pageHashMap[targetPage];
    if (hash) {
      const url = `#${hash}`;
      replace
        ? window.history.replaceState(null, "", url)
        : window.history.pushState(null, "",  url);
      sessionStorage.setItem("resumePilotPage", targetPage);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [session]);

  function handleResultLoading() {
    setRenderError("");
    setActivePage("resultPage");
    window.history.replaceState(null, "", "#results");
  }

  function handleResult(data) {
    try {
      setJobData([]); 
      setResultData(data);
      fetchJobs(data);
      setHasValidResults(true);
      setRenderError("");
      navigate("resultPage", true);
    } catch (err) {
      console.error("Could not render analysis results:", err, data);
      setRenderError(
        `Analysis finished, but the detailed cards could not be shown. Backend response: ${JSON.stringify(data, null, 2)}`
      );
      navigate("resultPage", true);
    }
  }
  async function fetchJobs(data) {
    const token = await getToken();
    if (!token) {
      setJobError("Please log in again to load job suggestions.");
      setJobData([]);
      sessionStorage.setItem("resumePilotJobs", "[]");
      sessionStorage.setItem("resumePilotJobError", "Please log in again to load job suggestions.");
      return;
    }

    setJobLoading(true);
    setJobError("");

    try {
      const resp = await fetch(`${API_BASE}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_title: data.job_title || data.job_title_match?.job_title || data.job_title_match || "",
          matched_hard_skills: data.matched_hard_skills || [],
          results_per_page: 8,
          country: "in",
        }),
      });

      const result = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(formatMessage(result.detail || result.error || result.Error || `Jobs request failed (${resp.status})`));
      }

      const jobs = Array.isArray(result.jobs) ? result.jobs : [];
      setJobData(jobs);
      setJobError("");
      sessionStorage.setItem("resumePilotJobs", JSON.stringify(jobs));
      sessionStorage.setItem("resumePilotJobsTouched", "true");
      sessionStorage.removeItem("resumePilotJobError");
    } catch (e) {
      console.error("[jobs] fetch failed:", e);
      setJobError(e.message || "Could not load job suggestions.");
      setJobData([]);
      sessionStorage.setItem("resumePilotJobs", "[]");
      sessionStorage.setItem("resumePilotJobError", e.message || "Could not load job suggestions.");
    } finally {
      setJobLoading(false);
    }
  }

  const effectiveActivePage =
    authReady && session && (activePage === "loginPage" || activePage === "signupPage")
      ? "matcherPage"
      : authReady && !session && isProtectedPage(activePage)
        ? "landingPage"
        : activePage;
  const effectiveActivePage = authReady && !session && isProtectedPage(activePage) ? "landingPage" : activePage;

  useEffect(() => {
    if (effectiveActivePage !== "resultPage" && effectiveActivePage !== "jobsPage") return;

    restoreStoredJobs();

    function resumePilotJobsRestore() {
      restoreStoredJobs();
    }

    window.addEventListener("focus", resumePilotJobsRestore);
    document.addEventListener("visibilitychange", resumePilotJobsRestore);

    return () => {
      window.removeEventListener("focus", resumePilotJobsRestore);
      document.removeEventListener("visibilitychange", resumePilotJobsRestore);
    };
  }, [effectiveActivePage]);
  const sharedProps = { activePage: effectiveActivePage, onNavigate: navigate, session };

  return (
    <>
      {effectiveActivePage === "landingPage" && (
        <LandingPage onStart={() => navigate("matcherPage")} {...sharedProps} />
      )}
      <MatcherPage    {...sharedProps} resultData={resultData} onResult={handleResult} onResultLoading={handleResultLoading} />
      <ResultPage {...sharedProps} resultData={resultData} renderError={renderError} />
      <JobPortalSection {...sharedProps} jobData={jobData} jobError={jobError} jobLoading={jobLoading} />
      <AboutPage      {...sharedProps} />
      <ContributorsPage {...sharedProps} />
      <LoginPage      {...sharedProps} />
      <SignupPage      {...sharedProps} />
      <HistoryPage    {...sharedProps} />   {/* â† FIX 4 */}
    </>
  );
}











