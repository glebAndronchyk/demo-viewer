import { Badge, Button, Dropdown } from "antd";
import type { ReactNode } from "react";
import { NotificationOutlined } from "@ant-design/icons";

interface NotificationsListProps {
  notifications: { key: string; label: ReactNode }[];
}

export const NotificationsList = (props: NotificationsListProps) => {
  const { notifications } = props;

  return (
    <Dropdown placement="bottomRight" menu={{ items: notifications }}>
      <Badge count={notifications.length}>
        <Button
          disabled={!notifications.length}
          type="primary"
          shape="circle"
          icon={<NotificationOutlined />}
        />
      </Badge>
    </Dropdown>
  );
};
