import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ServicesProvider } from "./shared/di/ServicesContext";
import { createServices } from "./shared/di/services";
import "./styles.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container is missing in index.html");
}

createRoot(container).render(
  <StrictMode>
    <ServicesProvider services={createServices()}>
      <App />
    </ServicesProvider>
  </StrictMode>
);
