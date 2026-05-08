import { Flex, Layout, Pagination } from "antd";
import {
  RootPageViewModel,
  useRootPageViewModel,
} from "./viewmodel/RootPageViewModel.tsx";
import { useLoaderData } from "react-router";

const RootPage = () => {
  const { changeMatchesPage } = useRootPageViewModel();

  const { matches, page } =
    useLoaderData<Awaited<ReturnType<typeof useRootPageViewModel.loader>>>();

  const handlePagination = (current: number) => {
    changeMatchesPage(current);
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
            return <div key={m.demoId}>{m.map}</div>;
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
