import { NotificationsList as UINotificationsList } from "../../../components/NotificationsList/NotificationsList.tsx";
import { type ReactNode, useEffect, useState } from "react";
import type {
  GroupInvitationNotificationDto,
  NotificationDto,
} from "@demo-viewer/shared-types";
import { useRootViewModel } from "../../../viewmodels/RootViewModel.tsx";
import { Button, Flex, Space, Typography } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";

export const NotificationsList = () => {
  const { subscribeToNotification } = useRootViewModel();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);

  useEffect(() => {
    const initHandler = (e: MessageEvent) => {
      const data: NotificationDto[] = JSON.parse(e.data);
      setNotifications(data);
    };
    const updateHandler = (e: MessageEvent) => {
      const updated: NotificationDto = JSON.parse(e.data);

      setNotifications((prev) => {
        if (
          updated.status === "delivered" ||
          updated.status === "dismissed" ||
          updated.status === "accepted"
        ) {
          return prev.filter((n) => n.id !== updated.id);
        }

        const ids = new Set(prev.map((n) => n.id));

        if (!ids.has(updated.id)) return [...prev, updated];
        return prev.map((n) => (n.id === updated.id ? updated : n));
      });
    };

    const dispose = subscribeToNotification((type, e) => {
      if (type === "init") initHandler(e);
      if (type === "update") updateHandler(e);
    });

    return () => {
      dispose();
    };
  }, []);

  const items = notifications.map((n) => ({
    key: n.id,
    label: NotificationsList.renderNotification(n) as ReactNode,
  }));

  return <UINotificationsList notifications={items} />;
};

NotificationsList.renderNotification = (n: NotificationDto) => {
  switch (n.type) {
    case "group_invitation":
      return (
        <NotificationsList.TeamInvite
          {...(n as never as GroupInvitationNotificationDto)}
        />
      );
    default:
      return null;
  }
};

NotificationsList.TeamInvite = (n: GroupInvitationNotificationDto) => {
  const { declineGroupInvitation, acceptGroupInvitation } =
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRootViewModel();

  return (
    <Flex gap="small" align="center" justify="space-between">
      <Typography.Text>
        You've been invited to the team by player:{" "}
        <Typography.Text strong>{n.payload.invitedBy}</Typography.Text>
      </Typography.Text>
      <Space>
        <Button
          size="small"
          type="primary"
          icon={<CheckOutlined />}
          onClick={() => acceptGroupInvitation(n.id)}
        />
        <Button
          size="small"
          danger
          icon={<CloseOutlined />}
          onClick={() => declineGroupInvitation(n.id)}
        />
      </Space>
    </Flex>
  );
};
