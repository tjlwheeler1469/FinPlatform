import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress React error overlay for Chrome extension errors (frame_ant, etc.)
if (process.env.NODE_ENV === "development") {
  const origError = window.onerror;
  window.onerror = (msg, source, ...rest) => {
    if (source && (source.includes("chrome-extension") || source.includes("moz-extension"))) {
      return true; // Swallow extension errors
    }
    if (origError) return origError(msg, source, ...rest);
    return false;
  };
  // Also catch unhandled rejections from extensions
  window.addEventListener("unhandledrejection", (e) => {
    if (e.reason?.stack?.includes("chrome-extension") || e.reason?.message?.includes("frame_ant")) {
      e.preventDefault();
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
