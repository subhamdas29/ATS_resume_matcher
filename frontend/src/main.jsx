import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "../styles.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ResumePilot render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ fontFamily: "Arial, sans-serif", padding: 24, color: "#991b1b" }}>
          <h1 style={{ fontSize: 24, marginBottom: 10 }}>ResumePilot could not load</h1>
          <p>{this.state.error.message || "A browser error stopped the app."}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
