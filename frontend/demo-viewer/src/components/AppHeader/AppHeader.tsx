import { Button, Layout, Spin, Typography, theme } from "antd";
import { useAuth } from "../../modules/auth";
import { ProfileImage } from "../../modules/auth/components/ProfileImage.tsx";
import { Link } from "react-router";

export function AppHeader() {
  const { user, isLoading } = useAuth();
  const { token } = theme.useToken();

  return (
    <Layout.Header
      style={{
        position: "fixed",
        width: "100%",
        top: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
      }}
    >
      <Typography.Title
        level={4}
        style={{ margin: 0, color: token.colorPrimary }}
      >
        <Link to="/">Demo Viewer</Link>
      </Typography.Title>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {isLoading ? (
          <Spin size="small" />
        ) : user ? (
          <ProfileImage user={user} />
        ) : (
          <Button type="primary" href="http://localhost:3000/auth/steam">
            Login with Steam
          </Button>
        )}
      </div>
    </Layout.Header>
  );
}
