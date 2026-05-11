import { Layout, Tabs, Typography } from "antd";
import {
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import type { GroupDetailData } from "./viewmodel/GroupDetailViewModel.tsx";
import { useAuth } from "../../modules/auth";
import MembersPage from "./pages/MembersPage.tsx";
import MatchesPage from "./pages/MatchesPage.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";

const GroupDetailPage = () => {
  const { group } = useLoaderData<GroupDetailData>();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const isOwner = user?.userId === group.ownerId;

  const tabItems = [
    { key: "members", label: "Members" },
    { key: "matches", label: "Matches" },
    ...(isOwner ? [{ key: "settings", label: "Settings" }] : []),
  ];

  const activeTab = location.pathname.split("/")[3] ?? "members";

  const handleTabChange = (key: string) => {
    navigate(`/groups/${id}/${key}`);
  };

  return (
    <Layout className="h-full">
      <Typography.Title level={4} className="mb-2">
        {group.name}
      </Typography.Title>
      <Tabs activeKey={activeTab} items={tabItems} onChange={handleTabChange} />
      <Outlet />
    </Layout>
  );
};

GroupDetailPage.MembersPage = MembersPage;
GroupDetailPage.MatchesPage = MatchesPage;
GroupDetailPage.SettingsPage = SettingsPage;

export default GroupDetailPage;
