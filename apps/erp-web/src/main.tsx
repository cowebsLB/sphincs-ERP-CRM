import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <main>
      <h1>ERP App</h1>
      <p>Items, suppliers, and purchase orders.</p>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

