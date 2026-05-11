import { Avatar, Col, Flex, Pagination, Row, Tag, Typography } from "antd";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import type { GroupMember } from "../viewmodel/GroupDetailViewModel.tsx";

interface MatchesLoaderData {
  matches: {
    totalItems: number;
    pageSize: number;
    totalPages: number;
    page: {
      demoId: string;
      matchId: string;
      map: string;
      outcome: { ctWins: number; tWins: number };
      players: { name: string; steamId: string; avatar: string }[];
    }[];
  };
  members: GroupMember[];
  page: number;
  playerFilter: string | null;
}

const MatchesPage = () => {
  const { matches, members, page, playerFilter } =
    useLoaderData<MatchesLoaderData>();
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const handlePlayerFilter = (userId: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (userId) {
        next.set("player", userId);
      } else {
        next.delete("player");
      }
      next.set("page", "1");
      return next;
    });
  };

  const handlePageChange = (p: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(p));
      return next;
    });
  };

  const handleMatchClick = (matchId: string) => {
    navigate(`/player/${matchId}`);
  };

  return (
    <div className="p-2">
      <Flex gap={8} className="mb-4" wrap>
        <Tag
          className="cursor-pointer"
          color={!playerFilter ? "blue" : undefined}
          onClick={() => handlePlayerFilter(null)}
        >
          All
        </Tag>
        {members.map((m) => (
          <Tag
            key={m.userId}
            className="cursor-pointer"
            color={playerFilter === m.userId ? "blue" : undefined}
            onClick={() => handlePlayerFilter(m.userId)}
          >
            {m.userId}
          </Tag>
        ))}
      </Flex>

      <div className="flex mb-2 justify-between items-center">
        <Typography.Text type="secondary">
          {matches?.totalItems ?? 0} matches
        </Typography.Text>
        <Pagination
          current={page}
          total={matches?.totalItems ?? 0}
          pageSize={matches?.pageSize ?? 10}
          showSizeChanger={false}
          onChange={handlePageChange}
        />
      </div>

      <Flex vertical gap={8}>
        {(matches?.page ?? []).map((m) => (
          <Row
            key={m.demoId}
            className="cursor-pointer p-2 border items-center justify-between"
            onClick={() => handleMatchClick(m.matchId)}
          >
            <Col span={4}>{m.map}</Col>
            <Col span={8}>
              CT:{m.outcome.ctWins} - T:{m.outcome.tWins}
            </Col>
            <Col>
              <Flex gap={8} justify="flex-end">
                {m.players.map((p) => (
                  <Avatar
                    key={p.steamId || p.name}
                    src={<img draggable={false} src={p.avatar} alt="avatar" />}
                    size={32}
                  />
                ))}
              </Flex>
            </Col>
          </Row>
        ))}
      </Flex>
    </div>
  );
};

export default MatchesPage;
