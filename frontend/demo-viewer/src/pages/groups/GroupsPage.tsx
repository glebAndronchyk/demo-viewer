import { Button, Divider, Input, Layout, Menu, Modal, Typography } from "antd";
import { Link, Outlet, useLoaderData, useLocation } from "react-router";
import { TeamOutlined } from "@ant-design/icons";
import {
  GroupsPageViewModel,
  useGroupsPageViewModel,
  type MyGroupsData,
} from "./viewmodel/GroupsPageViewModel.tsx";
import GroupDetailPage from "./GroupDetailPage.tsx";
import { useTransition, useState } from "react";

const GroupsSider = () => {
  const data = useLoaderData<MyGroupsData>();
  const { openCreateModal } = useGroupsPageViewModel();
  const location = useLocation();

  const allItems = [
    ...(data.owned.length > 0
      ? [
          { type: "group" as const, label: "Owned", key: "owned-group" },
          ...data.owned.map((g) => ({
            key: g.id,
            label: <Link to={`/groups/${g.id}`}>{g.name}</Link>,
            icon: <TeamOutlined />,
          })),
        ]
      : []),
    ...(data.joined.length > 0
      ? [
          { type: "group" as const, label: "Joined", key: "joined-group" },
          ...data.joined.map((g) => ({
            key: g.id,
            label: <Link to={`/groups/${g.id}`}>{g.name}</Link>,
            icon: <TeamOutlined />,
          })),
        ]
      : []),
  ];

  const selectedKey = location.pathname.split("/")[2] ?? "";

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        {allItems.length === 0 ? (
          <Typography.Text type="secondary" className="p-3 block">
            No groups yet
          </Typography.Text>
        ) : (
          <Menu selectedKeys={[selectedKey]} items={allItems} mode="inline" />
        )}
      </div>
      <Divider className="my-2" />
      <div className="p-2">
        <Button type="primary" block onClick={openCreateModal}>
          Create Group
        </Button>
      </div>
    </div>
  );
};

const CreateGroupModal = () => {
  const { createModalOpen, closeCreateModal, createGroup } = useGroupsPageViewModel();
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleOk = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      await createGroup(name.trim());
      setName("");
    });
  };

  return (
    <Modal
      title="Create Group"
      open={createModalOpen}
      onOk={handleOk}
      onCancel={() => { closeCreateModal(); setName(""); }}
      confirmLoading={isPending}
      okText="Create"
    >
      <Input
        placeholder="Group name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onPressEnter={handleOk}
        autoFocus
      />
    </Modal>
  );
};

const GroupsPageInner = () => {
  return (
    <Layout className="h-full p-5">
      <Layout.Sider className="mr-3" width={220}>
        <GroupsSider />
      </Layout.Sider>
      <Layout.Content>
        <Outlet />
      </Layout.Content>
      <CreateGroupModal />
    </Layout>
  );
};

const GroupsPage = () => (
  <GroupsPageViewModel>
    <GroupsPageInner />
  </GroupsPageViewModel>
);

GroupsPage.DetailPage = GroupDetailPage;

export default GroupsPage;
