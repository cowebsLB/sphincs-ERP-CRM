/** Builds the unified ERP app URL, preserving the hash from the legacy CRM origin (e.g. port 5174). */
export function getUnifiedAppRedirectUrl(erpBase: string, hash: string): string {
  const base = erpBase.replace(/\/+$/, "");
  const h = hash && hash.length > 1 ? hash : "#/contacts";
  return `${base}${h.startsWith("#") ? h : `#${h}`}`;
}
