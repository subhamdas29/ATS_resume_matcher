import React, { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = ((window.ENV_API_URL || import.meta.env.VITE_API_URL || "").replace(/\/$/, "")) || "https://atsresumematcher-production.up.railway.app";

const pageHashMap = {
  matcherPage: "matcher",
  resultPage: "results",
  aboutPage: "about",
  contributorsPage: "contributors",
  loginPage: "login",
  signupPage: "signup"
};

const hashPageMap = {
  matcher: "matcherPage",
  results: "resultPage",
  about: "aboutPage",
  contributors: "contributorsPage",
  login: "loginPage",
  signup: "signupPage"
};

function pageFromHash(hasResults) {
  const hash = window.location.hash.replace("#", "");
  if (!hash) return "landingPage";
  const page = hashPageMap[hash];
  if (page === "resultPage" && !hasResults) return "matcherPage";
  return page || "landingPage";
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

function scoreTone(score) {
  if (score >= 70) {
    return {
      headline: "Strong match",
      sub: "Your resume is well-aligned with this role.",
      color: "#22c55e"
    };
  }

  if (score >= 45) {
    return {
      headline: "Moderate match",
      sub: "A few targeted improvements will push you higher.",
      color: "#eab308"
    };
  }

  return {
    headline: "Needs work",
    sub: "Your resume needs significant tailoring for this role.",
    color: "#ef4444"
  };
}

function Nav({ activePage, onNavigate }) {
  const items = [
    ["matcherPage", "ResumePilot"],
    ["aboutPage", "About ResumePilot"],
    ["contributorsPage", "Contributors"]
  ];

  return (
    <nav className="top-nav" aria-label="Primary navigation">
      {items.map(([page, label]) => (
        <button
          key={page}
          className={`nav-btn ${activePage === page || (activePage === "resultPage" && page === "matcherPage") ? "active" : ""}`}
          type="button"
          onClick={() => onNavigate(page)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

function Header({ activePage, onNavigate }) {
  return (
    <header>
      <h1>
        Resume<span className="logo-pink">Pilot</span>
      </h1>
      <Nav activePage={activePage} onNavigate={onNavigate} />
    </header>
  );
}

function LandingPage({ onStart, onNavigate }) {
  return (
    <section className="page-shell" id="landingPage">
      <div className="landing-auth-bar" aria-label="Account actions">
        <button className="landing-auth-btn ghost" type="button" onClick={() => onNavigate("loginPage")}>
          Login
        </button>
        <button className="landing-auth-btn filled" type="button" onClick={() => onNavigate("signupPage")}>
          Sign Up
        </button>
      </div>
      <div className="landing">
        <div className="landing-copy">
          <h1>ResumePilot</h1>
          <div className="tagline">Score Higher. Get Hired.</div>
          <p className="intro">Optimize your resume for Applicant Tracking Systems and increase your chances of getting noticed by recruiters.</p>

          <div className="cta-row">
            <button className="btn-primary" id="openMatcherBtn" type="button" onClick={onStart}>
              <span className="btn-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 3v12m0-12 4 4m-4-4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              Upload Resume
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
            <Feature title="ATS Friendly" text="Pass ATS checks with ease" icon="document" />
            <Feature title="Improve Score" text="Get personalized recommendations" icon="chart" />
            <Feature title="Land Interviews" text="Increase your chances of getting hired" icon="profile" />
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
          <circle cx="32" cy="25" r="7" stroke="currentColor" strokeWidth="2.5" />
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
        <MockSection title="Education" widths={["74%", "56%", "66%"]} />

        <div className="mock-section">
          <h4>Skills</h4>
          <div className="skill-pills">
            {["70px", "62px", "56px", "64px", "48px", "66px"].map((width) => (
              <span key={width} style={{ "--w": width }}></span>
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
          {["85%", "66%", "92%"].map((width) => (
            <span key={width} style={{ "--w": width }}></span>
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
      {widths.map((width) => (
        <div className="mock-bullet" key={width}>
          <span style={{ "--w": width }}></span>
        </div>
      ))}
    </div>
  );
}

function MatcherPage({ activePage, onNavigate, resultData, onResult, onResultLoading }) {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  async function analyze(event) {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!jobTitle.trim() || !jobDescription.trim() || !file) {
      setError("Please fill in all three fields before analyzing.");
      return;
    }

    setLoading(true);
    setStatus("Sending resume to backend...");

    const form = new FormData();
    form.append("resume", file);
    form.append("job_description", jobDescription.trim());
    form.append("job_title", jobTitle.trim());

    try {
      const response = await fetch(`${API_BASE}/analyze`, { method: "POST", body: form });
      const raw = await response.text();
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
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      fileInputRef.current.files = dataTransfer.files;
    }
  }

  return (
    <section className={`matcher-page ${activePage === "matcherPage" ? "visible" : ""}`} id="matcherPage">
      <Header activePage={activePage} onNavigate={onNavigate} />

      <main>
        <div className="hero">
          <h2>
            See how your resume<br />scores against any <em>JD</em>
          </h2>
          <p>Upload your resume, paste the job description, and get a detailed ATS analysis in seconds.</p>
        </div>

        <form className="form-panel" onSubmit={analyze}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="jobTitle">Job Title</label>
              <input type="text" id="jobTitle" placeholder="e.g. Junior Backend Developer" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="resumeFile">Resume (PDF)</label>
              <div
                className={`drop-zone ${isDragging ? "drag-over" : ""}`}
                id="dropZone"
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <input ref={fileInputRef} type="file" id="resumeFile" accept=".pdf" title="Upload resume PDF" onChange={handleFileChange} />
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
              <textarea id="jobDescription" placeholder="Paste the full job description here..." value={jobDescription} onChange={(event) => setJobDescription(event.target.value)}></textarea>
            </div>
          </div>

          <button className="btn-analyze" id="analyzeBtn" type="submit" disabled={loading}>
            {loading ? <><div className="spinner"></div> Analyzing...</> : "Analyze Resume"}
          </button>
          <div className={`status-msg ${status ? "visible" : ""}`} id="statusMsg">{status}</div>
          <div className={`error-msg ${error ? "visible" : ""}`} id="errorMsg">{error}</div>
        </form>

        <hr className="divider" />

        <Results data={resultData} />
      </main>
    </section>
  );
}

function ResultPage({ activePage, onNavigate, resultData, renderError }) {
  return (
    <section className={`result-page ${activePage === "resultPage" ? "visible" : ""}`} id="resultPage">
      <Header activePage={activePage} onNavigate={onNavigate} />
      <main className="result-content" id="resultPageContent">
        {renderError ? (
          <div className="results-render-error">{renderError}</div>
        ) : resultData ? (
          <Results data={resultData} visible />
        ) : (
          <div className="results-loading">Preparing your results...</div>
        )}
      </main>
    </section>
  );
}

function Results({ data, visible = false }) {
  const score = data?.ats_score ?? 0;
  const tone = scoreTone(score);
  const circumference = 226.2;
  const offset = circumference - (score / 100) * circumference;
  const weakSections = toList(data?.weak_sections);

  return (
    <section id="results" className={visible || data ? "visible" : ""}>
      <div className="results-header">
        <div className="score-ring">
          <svg viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="36" fill="none" stroke="#e4ecfb" strokeWidth="7" />
            <circle
              id="scoreCircle"
              cx="44"
              cy="44"
              r="36"
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
          <p id="scoreSub">{data ? tone.sub : "-"}</p>
        </div>
      </div>

      <div className="cards-row">
        <InfoCard label="Word Count" value={data?.word_count || "-"} className={data?.word_count?.includes("within") ? "ok" : "warn"} />
        <InfoCard label="Job Title Match" value={data?.job_title_match || "-"} className={data?.job_title_match?.includes("aligns") ? "ok" : "warn"} />
        <InfoCard label="GitHub Profile" value={data?.github || "-"} className={data?.github?.includes("No GitHub") ? "warn" : "ok"} />
      </div>

      <SectionBlock color="#4f7cff" title="Overall Feedback">
        <p id="feedbackText">{data?.feedback || "-"}</p>
      </SectionBlock>

      <SectionBlock color="#22c55e" title="Hard Skills">
        <div className="chips" id="hardChips">
          {toList(data?.hard_skills_match).map((item) => <Chip key={`hard-match-${item}`} type="match" text={item} />)}
          {toList(data?.hard_skills_missing).map((item) => <Chip key={`hard-missing-${item}`} type="missing" text={item} />)}
        </div>
      </SectionBlock>

      <SectionBlock color="#a78bfa" title="Soft Skills">
        <div className="chips" id="softChips">
          {toList(data?.soft_skills_match).map((item) => <Chip key={`soft-match-${item}`} type="match" text={item} />)}
          {toList(data?.soft_skills_missing).map((item) => <Chip key={`soft-missing-${item}`} type="missing" text={item} />)}
        </div>
      </SectionBlock>

      {weakSections.length > 0 && (
        <SectionBlock color="#eab308" title="Weak Sections">
          <div className="chips" id="weakChips">
            {weakSections.map((item) => <Chip key={`weak-${item}`} type="weak" text={item} />)}
          </div>
        </SectionBlock>
      )}

      <SectionBlock color="#f97316" title="Suggestions to Improve">
        <ul className="suggestions-list" id="suggestionsList">
          {toList(data?.suggestions).map((item) => <li key={item}>{item}</li>)}
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

function SimplePage({ id, title, activePage, onNavigate, children }) {
  return (
    <section className={`simple-page ${activePage === id ? "visible" : ""}`} id={id}>
      <Header activePage={activePage} onNavigate={onNavigate} />
      <main className="simple-content">
        <h2>{title}</h2>
        <div className="editable-copy">{children}</div>
      </main>
    </section>
  );
}

function AboutPage(props) {
  return (
    <SimplePage id="aboutPage" title="About ResumePilot" {...props}>
      <h1><a href="https://github.com/subhamdas29/ATS_resume_matcher" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", color: "inherit" }}>ResumePilot</a></h1>
      <p><strong>ResumePilot</strong> is a smart ATS (Applicant Tracking System) score checker that scans your resume and gives a detailed analysis based on your resume, a job description, and a target job role, helping you understand exactly where you stand before applying.</p>
      <hr style={{ margin: "60px 0 40px 0" }} />
      <h2>What It Does</h2>
      <ul>
        <li><strong>ATS Score</strong> - a blended score calculated using semantic similarity, keyword matching, section quality, and job title alignment</li>
        <li><strong>Hard & Soft Skill Analysis</strong> - shows which skills from the job description are present in your resume and which are missing</li>
        <li><strong>Keyword Expansion</strong> - if your resume mentions <em>data analyst</em>, ResumePilot infers related skills like <em>numpy</em> and <em>matplotlib</em> even if they are not explicitly listed</li>
        <li><strong>Weak Section Detection</strong> - flags resume sections that need improvement</li>
        <li><strong>Overall Feedback & Suggestions</strong> - actionable recommendations tailored to your resume and the job description</li>
        <li><strong>GitHub Profile Analysis</strong> - detects GitHub links in your resume, scans profile activity, and factors it into your overall score</li>
        <li><strong>Word Count Check</strong> - tells you if your resume is too short, too long, or within the ideal 400-800 word range</li>
      </ul>
      <hr style={{ margin: "60px 0 40px 0" }} />
      <h2>How the ATS Score Is Calculated</h2>
      <p>The final score is a weighted blend of six signals:</p>
      <div style={{ background: "#f5f5f5", padding: "15px", borderRadius: "5px", fontFamily: "monospace", lineHeight: 1.8 }}>
        <div><strong>ATS Score =</strong></div>
        <div style={{ marginLeft: "20px" }}>
          <div>Section Score Average x 0.28</div>
          <div>Hard Skill Match x 0.35</div>
          <div>Semantic Similarity x 0.15</div>
          <div>Soft Skill Match x 0.07</div>
          <div>Job Title Match x 0.05</div>
          <div>GitHub Score x 0.10</div>
        </div>
      </div>
      <hr />
    </SimplePage>
  );
}

const contributors = [
  ["Subham Das", "Backend Developer", "Designed and built the backend pipeline, including FastAPI, PDF parsing, GitHub profile analysis, and the end-to-end /analyze endpoint.", "https://github.com/subhamdas29", "https://linkedin.com/in/subhamdas29"],
  ["Rivo Khara", "Backend Developer", "Implemented the ATS scoring algorithm, Groq-powered keyword extraction and expansion, and HuggingFace semantic similarity scoring.", "https://github.com/RivoKhara", "https://www.linkedin.com/in/rivo-khara-9966002b7/"],
  ["Sushobhan Biswas", "Role/Position", "Brief bio or contribution description", "https://github.com/USERNAME3", "https://linkedin.com/in/USERNAME3"],
  ["Arghyodeep Samanta", "Role/Position", "Brief bio or contribution description", "https://github.com/USERNAME4", "https://linkedin.com/in/USERNAME4"],
  ["Sovan Lal Ganguly", "Role/Position", "Brief bio or contribution description", "https://github.com/USERNAME5", "https://linkedin.com/in/USERNAME5"]
];

function ContributorsPage(props) {
  return (
    <SimplePage id="contributorsPage" title="Contributors" {...props}>
      <h1>Meet the Team</h1>
      <p>ResumePilot is built and maintained by passionate developers and designers. Meet the team behind the project:</p>
      <hr />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px", margin: "30px 0" }}>
        {contributors.map(([name, role, bio, github, linkedin]) => (
          <div key={name} style={{ textAlign: "center", padding: "20px", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
            <h3 style={{ margin: "15px 0", fontSize: "24px" }}>{name}</h3>
            <p style={{ color: "#666", margin: "10px 0" }}>{role}</p>
            <p style={{ fontSize: "14px", color: "#888", margin: "10px 0" }}>{bio}</p>
            <div style={{ marginTop: "15px", display: "flex", justifyContent: "center", gap: "15px" }}>
              <a href={github} target="_blank" rel="noopener noreferrer" className="social-link github-link" title="GitHub Profile">GH</a>
              <a href={linkedin} target="_blank" rel="noopener noreferrer" className="social-link linkedin-link" title="LinkedIn Profile">in</a>
            </div>
          </div>
        ))}
      </div>
      <hr />
      <p style={{ textAlign: "center", color: "#666", marginTop: "30px" }}>
        Want to contribute? Join us on <a href="https://github.com/subhamdas29/ATS_resume_matcher" target="_blank" rel="noopener noreferrer" style={{ color: "#1976d2", textDecoration: "none" }}>GitHub</a> and help make ResumePilot better!
      </p>
    </SimplePage>
  );
}

function AuthShell({ activePage, onNavigate, mode, title, subtitle, children, footer }) {
  return (
    <section className={`auth-page ${activePage === `${mode}Page` ? "visible" : ""}`} id={`${mode}Page`}>
      <Header activePage={activePage} onNavigate={onNavigate} />
      <main className="auth-content">
        <div className="auth-panel">
          <div className="auth-copy">
            <span className="auth-kicker">ResumePilot Account</span>
            <h2>{title}</h2>
            <p>{subtitle}</p>
            <div className="auth-mini-card">
              <strong>ATS-ready workflow</strong>
              <span>Keep your resume checks organized once backend auth is connected.</span>
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

function LoginPage(props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleLogin(event) {
    event.preventDefault();
    const response = "backend";
    setMessage(`Login request will connect to ${response}.`);
  }

  return (
    <AuthShell
      {...props}
      mode="login"
      title="Welcome back"
      subtitle="Sign in to continue your resume analysis flow with a clean, focused workspace."
      footer={
        <p className="auth-switch">
          New to ResumePilot? <button type="button" onClick={() => props.onNavigate("signupPage")}>Create an account</button>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleLogin}>
        <label htmlFor="loginEmail">Email</label>
        <input id="loginEmail" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />

        <label htmlFor="loginPassword">Password</label>
        <input id="loginPassword" type="password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required />

        <button className="auth-submit" type="submit">Login</button>
        {message && <div className="auth-message">{message}</div>}
      </form>
    </AuthShell>
  );
}

function SignupPage(props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSignup(event) {
    event.preventDefault();
    const response = "backend";
    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setMessage(`Sign up request will connect to ${response}.`);
  }

  return (
    <AuthShell
      {...props}
      mode="signup"
      title="Create your account"
      subtitle="Start with a simple profile now; your backend account creation can plug in here later."
      footer={
        <p className="auth-switch">
          Already have an account? <button type="button" onClick={() => props.onNavigate("loginPage")}>Login</button>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSignup}>
        <label htmlFor="signupName">Full Name</label>
        <input id="signupName" type="text" placeholder="Your name" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />

        <label htmlFor="signupEmail">Email</label>
        <input id="signupEmail" type="email" placeholder="you@example.com" value={form.email} onChange={(event) => updateField("email", event.target.value)} required />

        <label htmlFor="signupPassword">Password</label>
        <input id="signupPassword" type="password" placeholder="Create a password" value={form.password} onChange={(event) => updateField("password", event.target.value)} required />

        <label htmlFor="signupConfirmPassword">Retype Password</label>
        <input id="signupConfirmPassword" type="password" placeholder="Retype your password" value={form.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} required />

        <button className="auth-submit" type="submit">Sign Up</button>
        {message && <div className="auth-message">{message}</div>}
      </form>
    </AuthShell>
  );
}

export default function App() {
  const [hasValidResults, setHasValidResults] = useState(false);
  const [activePage, setActivePage] = useState(() => pageFromHash(false));
  const [resultData, setResultData] = useState(null);
  const [renderError, setRenderError] = useState("");

  useEffect(() => {
    function restorePageState() {
      setActivePage(pageFromHash(hasValidResults));
    }

    window.addEventListener("popstate", restorePageState);
    window.addEventListener("hashchange", restorePageState);
    return () => {
      window.removeEventListener("popstate", restorePageState);
      window.removeEventListener("hashchange", restorePageState);
    };
  }, [hasValidResults]);

  const navigate = useMemo(() => (pageId, replace = false) => {
    setActivePage(pageId);
    const hash = pageHashMap[pageId];
    if (hash) {
      const url = `#${hash}`;
      if (replace) {
        window.history.replaceState(null, "", url);
      } else {
        window.history.pushState(null, "", url);
      }
      sessionStorage.setItem("resumePilotPage", pageId);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  function handleResultLoading() {
    setRenderError("");
    setActivePage("resultPage");
    window.history.replaceState(null, "", "#results");
  }

  function handleResult(data) {
    try {
      setResultData(data);
      setHasValidResults(true);
      setRenderError("");
      navigate("resultPage", true);
    } catch (err) {
      console.error("Could not render analysis results:", err, data);
      setRenderError(`Analysis finished, but the detailed cards could not be shown. Backend response: ${JSON.stringify(data, null, 2)}`);
      navigate("resultPage", true);
    }
  }

  return (
    <>
      {activePage === "landingPage" && <LandingPage onStart={() => navigate("matcherPage")} onNavigate={navigate} />}
      <MatcherPage activePage={activePage} onNavigate={navigate} resultData={resultData} onResult={handleResult} onResultLoading={handleResultLoading} />
      <ResultPage activePage={activePage} onNavigate={navigate} resultData={resultData} renderError={renderError} />
      <AboutPage activePage={activePage} onNavigate={navigate} />
      <ContributorsPage activePage={activePage} onNavigate={navigate} />
      <LoginPage activePage={activePage} onNavigate={navigate} />
      <SignupPage activePage={activePage} onNavigate={navigate} />
    </>
  );
}
