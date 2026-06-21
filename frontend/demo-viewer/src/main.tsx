import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./modules/auth";

import { ConfigProvider, theme } from "antd";
import { RootViewModel } from "./viewmodels/RootViewModel.tsx";

createRoot(document.getElementById("root")!).render(
  <ConfigProvider
    theme={{
      algorithm: theme.defaultAlgorithm,
      token: {
        colorPrimary: "#2e2118",
        colorLink: "#4a7c59",
        colorSuccess: "#4a7c59",
        colorWarning: "#a0762a", // --amber: ochre
        colorError: "#8b3a2a", // --magenta: burnt sienna
        colorInfo: "#3a5f8a", // --cyan: ink blue
        colorBgLayout: "#f7f3ed", // --bg-void: off-white page
        colorBgContainer: "#ffffff", // --bg-panel
        colorBgElevated: "#ede7da", // --bg-panel-hi: masthead
        colorBgSpotlight: "#ede0cc", // --bg-inset
        colorText: "#2e2118", // --ink-hi: dark sepia
        colorTextSecondary: "#5a4535", // --ink-mid
        colorTextTertiary: "#7a6555", // --ink-lo
        colorTextQuaternary: "#b8a898", // --ink-ghost
        colorBorder: "rgba(140,100,70,0.5)",
        colorBorderSecondary: "rgba(185,155,110,0.4)",
        borderRadius: 2,
        fontFamily: "var(--font-ui)",
        fontSize: 18,
        lineWidth: 2,
        controlHeight: 36,
      },
      components: {
        Layout: {
          headerBg: "#ede7da", // --bg-panel-hi
          headerColor: "#2e2118", // --ink-hi
          siderBg: "#fcfaf7", // --bg-panel (colorBgContainer)
        },
        Button: {
          defaultBg: "#fcfaf7",
          defaultColor: "#2e2118",
          defaultBorderColor: "#2e2118",
          defaultHoverBg: "#f5ede0",
          defaultHoverColor: "#2e2118",
          defaultHoverBorderColor: "#2e2118",
          defaultActiveBg: "#ede0cc",
          defaultActiveColor: "#2e2118",
          defaultActiveBorderColor: "#2e2118",
          primaryColor: "#fcfaf7",
          fontWeight: 600,
          contentFontSize: 15,
          defaultShadow: "none",
          primaryShadow: "none",
        },
      },
    }}
  >
    <AuthProvider>
      <RootViewModel>
        <App />
      </RootViewModel>
    </AuthProvider>
  </ConfigProvider>,
);
