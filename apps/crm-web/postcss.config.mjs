/**
 * Stops postcss-load-config from walking up to a user-level postcss.config.js
 * (which may require tailwindcss and break this app).
 */
export default { plugins: [] };
