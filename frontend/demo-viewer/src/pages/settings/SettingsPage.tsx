import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Form, Input, Typography, message } from "antd";
import { useAuth } from "../../modules/auth";

interface SettingsFormValues {
  steamIdKey: string;
  knownShareCode: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values: SettingsFormValues) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `http://localhost:3000/user/${user.userId}/update-user-sharing-data`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      if (!res.ok) throw new Error("Request failed");
      await messageApi.success("Settings saved");
      navigate("/");
    } catch {
      messageApi.error("Failed to save settings");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "64px auto", padding: "0 24px" }}>
      {contextHolder}
      <Typography.Title level={3}>Settings</Typography.Title>
      {user?.hasSharingData && (
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
          Your Steam credentials are already configured. Submitting this form will overwrite them.
        </Typography.Text>
      )}
      <Form layout="vertical" onFinish={onFinish} disabled={submitting}>
        <Form.Item
          label="Steam ID Key"
          name="steamIdKey"
          rules={[{ required: true, message: "Steam ID Key is required" }]}
        >
          <Input placeholder="STEAM_1:0:XXXXXXXX" />
        </Form.Item>
        <Form.Item
          label="Last Known Share Code"
          name="knownShareCode"
          rules={[{ required: true, message: "Share code is required" }]}
        >
          <Input placeholder="CSGO-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>
            Save
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
