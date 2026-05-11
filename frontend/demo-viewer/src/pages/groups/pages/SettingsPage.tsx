import { Button, Flex, Form, Input, message, Switch, Typography } from "antd";
import { useLoaderData, useRevalidator } from "react-router";
import type { GroupDetailData } from "../viewmodel/GroupDetailViewModel.tsx";
import { useTransition, useState } from "react";

const API = "http://localhost:3000";

const SettingsPage = () => {
  const { group } = useLoaderData<GroupDetailData>();
  const { revalidate } = useRevalidator();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(group.name);
  const [isOpen, setIsOpen] = useState(group.isOpen);

  const handleSave = () => {
    startTransition(async () => {
      const res = await fetch(`${API}/team/owner/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, isOpen }),
      }).then((r) => r.json());

      if (res.isSuccess) {
        message.success("Group updated");
        revalidate();
      } else {
        message.error(res.error ?? "Failed to update group");
      }
    });
  };

  return (
    <div className="p-2" style={{ maxWidth: 480 }}>
      <Typography.Title level={5} className="mb-4">
        Group Settings
      </Typography.Title>
      <Form layout="vertical">
        <Form.Item label="Group name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Form.Item>
        <Form.Item label="Open group">
          <Flex gap={8} align="center">
            <Switch checked={isOpen} onChange={setIsOpen} />
            <Typography.Text type="secondary">
              {isOpen ? "Anyone can join" : "Invite only"}
            </Typography.Text>
          </Flex>
        </Form.Item>
        <Form.Item>
          <Button type="primary" loading={isPending} onClick={handleSave}>
            Save changes
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default SettingsPage;
