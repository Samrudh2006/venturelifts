import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { initFrontendSentry } from "./lib/sentry";
import App from "./App";

initFrontendSentry();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
