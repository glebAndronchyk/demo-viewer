import { Avatar, Col, Flex, Layout, Pagination, Row } from "antd";
import {
  RootPageViewModel,
  useRootPageViewModel,
} from "./viewmodel/RootPageViewModel.tsx";
import { useLoaderData } from "react-router";

const RootPage = () => {
  const { changeMatchesPage, navigateToDemo } = useRootPageViewModel();

  const { matches, page } =
    useLoaderData<Awaited<ReturnType<typeof useRootPageViewModel.loader>>>();

  const handlePagination = (current: number) => {
    changeMatchesPage(current);
  };

  const handleMatchNavigate = (id: string) => {
    navigateToDemo(id);
  };

  return (
    <Layout className="p-4 h-full">
      <div>
        <div className="flex mb-2 justify-between items-center">
          <p className="text-2xl">Registered matches list</p>
          <Pagination
            defaultCurrent={page}
            total={matches.totalItems}
            pageSize={matches.pageSize}
            showSizeChanger={false}
            onChange={handlePagination}
          />
        </div>
        <Flex orientation="vertical" gap={8} className="max-h-full">
          {matches.page.map((m) => {
            return (
              <Row
                key={m.demoId}
                className="cursor-pointer p-2 border items-center justify-between"
                onClick={() => handleMatchNavigate(m.matchId)}
              >
                <Col span={4}>{m.map}</Col>
                <Col span={8}>
                  CT:{m.outcome.ctWins} - T{m.outcome.tWins}
                </Col>
                <Col>
                  <Flex gap={8} justify="flex-end">
                    {m.players.map((p) => {
                      return (
                        <Avatar
                          src={
                            <img
                              draggable={false}
                              src={p.avatar}
                              alt="avatar"
                            />
                          }
                          key={p.steamId || p.name}
                          size={32}
                        />
                      );
                    })}
                  </Flex>
                </Col>
              </Row>
            );
          })}
        </Flex>
      </div>
    </Layout>
  );
};

export default function _() {
  return (
    <RootPageViewModel>
      <RootPage />
    </RootPageViewModel>
  );
}
