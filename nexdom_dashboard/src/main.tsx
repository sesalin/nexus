import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { HomeAssistantProvider } from "./components/dashboard/HomeAssistant";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HomeAssistantProvider>
      <App />
    </HomeAssistantProvider>
  </StrictMode>
);
