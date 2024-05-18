import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./global.css";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { Analytics } from "@vercel/analytics/react";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Theme>
      <App />
    </Theme>
    <Analytics />
  </React.StrictMode>
);
