import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ConfigProvider, theme } from "antd";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#4caf50",
          colorLink: "#388e3c",
          colorSuccess: "#66bb6a",
          colorBgLayout: "#1a1f1a",
          colorBgContainer: "#242a24",
          colorText: "#e8f5e9",
          colorTextSecondary: "#a5d6a7",
          borderRadius: 6,
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
);
