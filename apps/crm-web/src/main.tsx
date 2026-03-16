import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <main>
      <h1>CRM App</h1>
      <p>Contacts, leads, and opportunities.</p>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
