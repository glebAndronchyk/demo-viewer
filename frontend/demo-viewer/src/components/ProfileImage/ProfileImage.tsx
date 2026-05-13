import { Avatar, Dropdown, Flex, type MenuProps } from "antd";
import { UserOutlined } from "@ant-design/icons";

interface ProfileProps {
  options: MenuProps["items"];
  children?: React.ReactNode;
}

export const ProfileImage = (props: ProfileProps) => {
  return (
    <Flex orientation="horizontal" className="items-center">
      {props.children}
      <Dropdown placement="bottomRight" menu={{ items: props.options }}>
        <Avatar className="cursor-pointer" size={32} icon={<UserOutlined />} />
      </Dropdown>
    </Flex>
  );
};
