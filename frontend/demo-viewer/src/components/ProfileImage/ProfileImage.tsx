import { Avatar, Badge, Dropdown, Flex, type MenuProps } from "antd";
import { UserOutlined } from "@ant-design/icons";

interface ProfileProps {
  options: MenuProps["items"];
  notifications: number;
  children?: React.ReactNode;
}

export const ProfileImage = (props: ProfileProps) => {
  return (
    <Flex orientation="horizontal" className="items-center">
      {props.children}
      <Dropdown placement="bottomRight" menu={{ items: props.options }}>
        <Badge count={props.notifications}>
          <Avatar size={32} icon={<UserOutlined />} />
        </Badge>
      </Dropdown>
    </Flex>
  );
};
