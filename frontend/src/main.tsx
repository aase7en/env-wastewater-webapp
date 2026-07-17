import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// basename = repo subpath on GitHub Pages, "/" in dev.
// Vite injects import.meta.env.BASE_URL from vite.config.ts.
const basename = import.meta.env.BASE_URL || "/";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>
);
