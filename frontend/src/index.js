import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress Chrome/Firefox extension errors from React error overlay
// CRA's react-error-overlay uses window.addEventListener('error') with capture:true
// We must intercept BEFORE it using a capturing listener added first
if (process.env.NODE_ENV === "development") {
  // Intercept error events before CRA's overlay catches them
  window.addEventListener("error", (e) => {
    if (e.filename && (e.filename.includes("chrome-extension") || e.filename.includes("moz-extension"))) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }
    if (e.message && (e.message.includes("chrome-extension") || e.message.includes("frame_ant"))) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }
  }, true); // capture phase — runs before CRA's handler

  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason;
    if (reason?.stack?.includes("chrome-extension") || reason?.stack?.includes("moz-extension") ||
        reason?.message?.includes("chrome-extension") || reason?.message?.includes("frame_ant") ||
        reason?.message?.includes("Response body is already used")) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
