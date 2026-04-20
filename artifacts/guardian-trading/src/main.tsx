import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// When the Replit canvas embeds the app via /__replco/workspace_iframe.html,
// the browser URL path is that internal path rather than the app's real route.
// Read the intended path from the ?initialPath query param and rewrite
// history before React mounts so the router sees the correct route.
const _url = new URL(window.location.href);
const _initialPath = _url.searchParams.get("initialPath");
if (window.location.pathname.startsWith("/__replco/") && _initialPath) {
  window.history.replaceState(null, "", _initialPath);
}

createRoot(document.getElementById("root")!).render(<App />);
