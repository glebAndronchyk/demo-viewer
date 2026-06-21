import { Button, Flex, Input, List, message, Typography } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useLoaderData, useRevalidator } from "react-router";
import { useAuth } from "../../../modules/auth";
import { useTransition, useState } from "react";
import type { GroupDetailData, GroupMember } from "../viewmodel/GroupDetailViewModel.tsx";
import { AppConfiguration } from "../../../features/configuration";

const API = AppConfiguration.apiUrl;

const InviteForm = ({ groupId }: { groupId: string }) => {
  const [steamId, setSteamId] = useState("");
  const [isPending, startTransition] = useTransition();
  const { revalidate } = useRevalidator();

  const handleInvite = () => {
    if (!steamId.trim()) return;
    startTransition(async () => {
      const res = await fetch(`${API}/team/owner/${groupId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ steamId: steamId.trim() }),
      }).then((r) => r.json());

      if (res.isSuccess) {
        message.success("Invitation sent");
        setSteamId("");
        revalidate();
      } else {
        message.error(res.error ?? "Failed to invite");
      }
    });
  };

  return (
    <Flex gap={8} className="mb-4">
      <Input
        placeholder="Steam ID"
        value={steamId}
        onChange={(e) => setSteamId(e.target.value)}
        onPressEnter={handleInvite}
        style={{ maxWidth: 300 }}
      />
      <Button type="primary" loading={isPending} onClick={handleInvite}>
        Invite
      </Button>
    </Flex>
  );
};

const MembersPage = () => {
  const { group, members } = useLoaderData<GroupDetailData>();
  const { user } = useAuth();
  const { revalidate } = useRevalidator();
  const [, startTransition] = useTransition();
  const isOwner = user?.userId === group.ownerId;

  const handleRemove = (member: GroupMember) => {
    startTransition(async () => {
      const res = await fetch(`${API}/team/owner/${group.id}/users/${member.userId}`, {
        method: "DELETE",
        credentials: "include",
      }).then((r) => r.json());

      if (res.isSuccess) {
        revalidate();
      } else {
        message.error(res.error ?? "Failed to remove member");
      }
    });
  };

  return (
    <div className="p-2">
      {isOwner && <InviteForm groupId={group.id} />}
      <List
        dataSource={members}
        renderItem={(member) => (
          <List.Item
            actions={
              isOwner && member.userId !== user?.userId
                ? [
                    <Button
                      key="remove"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemove(member)}
                    />,
                  ]
                : []
            }
          >
            <List.Item.Meta
              title={<Typography.Text>{member.userId}</Typography.Text>}
              description={`Joined ${new Date(member.createdAt).toLocaleDateString()}`}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default MembersPage;
