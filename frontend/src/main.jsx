import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "../styles.css";

window.addEventListener("error", (event) => {
  const root = document.getElementById("root");
  if (!root) return;

  root.innerHTML = `
    <div style="font-family: Arial, sans-serif; padding: 24px; color: #991b1b;">
      <h1 style="font-size: 24px; margin-bottom: 10px;">ResumePilot could not load</h1>
      <p>${event.message || "A browser error stopped the app."}</p>
    </div>
  `;
});

createRoot(document.getElementById("root")).render(<App />);
