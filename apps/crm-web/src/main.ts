import { getUnifiedAppRedirectUrl } from "./redirect";

const erpBase =
  (import.meta.env.VITE_ERP_WEB_URL as string | undefined)?.trim().replace(/\/+$/, "") ||
  (import.meta.env.DEV ? "http://localhost:5173" : "");

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root");
}

if (!erpBase) {
  root.innerHTML =
    "<p style=\"font-family:system-ui,sans-serif;padding:24px;max-width:42rem\">" +
    "Set <code>VITE_ERP_WEB_URL</code> to your unified SPHINCS web app (same host as ERP, e.g. <code>http://localhost:5173</code>).</p>";
} else {
  window.location.replace(getUnifiedAppRedirectUrl(erpBase, window.location.hash));
}
