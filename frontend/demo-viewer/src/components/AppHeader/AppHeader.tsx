import { Button, Layout, Spin, Tag, Typography, theme } from "antd";
import { useAuth } from "../../modules/auth";

export function AppHeader() {
  const { user, isLoading } = useAuth();
  const { token } = theme.useToken();

  return (
    <Layout.Header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
      }}
    >
      <Typography.Title level={4} style={{ margin: 0, color: token.colorPrimary }}>
        Demo Viewer
      </Typography.Title>
      <div>
        {isLoading ? (
          <Spin size="small" />
        ) : user ? (
          <Tag color="success">Steam: {user.steamId.slice(0, 10)}…</Tag>
        ) : (
          <Button type="primary" href="http://localhost:3000/auth/steam">
            Login with Steam
          </Button>
        )}
      </div>
    </Layout.Header>
  );
}
