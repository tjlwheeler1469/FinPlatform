import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress Chrome/Firefox extension errors AND webpack chunk loading errors
if (process.env.NODE_ENV === "development") {
  window.addEventListener("error", (e) => {
    // Suppress extension errors
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
    // Suppress chunk loading errors (show ErrorBoundary instead of red overlay)
    if (e.message && (e.message.includes("Unexpected token '<'") || e.message.includes("Loading chunk"))) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }
  }, true);

  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason;
    const msg = reason?.message || "";
    const stack = reason?.stack || "";
    if (stack.includes("chrome-extension") || stack.includes("moz-extension") ||
        msg.includes("frame_ant") || msg.includes("Response body is already used") ||
        msg.includes("Unexpected token") || msg.includes("Loading chunk") ||
        msg.includes("ChunkLoadError")) {
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
