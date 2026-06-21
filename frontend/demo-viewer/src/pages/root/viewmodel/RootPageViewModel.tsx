import { createContext, type PropsWithChildren, useContext } from "react";
import { type LoaderFunction, useNavigate } from "react-router";
import type { MatchListResponseDto } from "@demo-viewer/shared-types";
import { debounce } from "../../../lib/debounce.ts";
import { AppConfiguration } from "../../../features/configuration";

const useRootPage = () => {
  const navigate = useNavigate();

  const changeMatchesPage = debounce((p: number) => {
    navigate(`/?page=${p}`);
  }, 200);

  const navigateToDemo = (id: string) => {
    navigate(`/player/${id}`);
  };

  return { navigateToDemo, changeMatchesPage };
};

const RootPageViewModelContext = createContext<ReturnType<typeof useRootPage>>(
  null as never,
);

// eslint-disable-next-line react-refresh/only-export-components
export const useRootPageViewModel = Object.assign(
  () => useContext(RootPageViewModelContext),
  {
    loader: (async (args) => {
      const url = new URL(args.request.url);
      const page = Number(url.searchParams.get("page") || 1);

      const matches = await fetch(
        `${AppConfiguration.apiUrl}/streaming/matches/list?page=${page}`,
      )
        .then((r) => r.json())
        .then((r) => r as MatchListResponseDto)
        .then((r) => r.data.pagination);

      return {
        matches,
        page,
      };
    }) satisfies LoaderFunction,
  },
);

export const RootPageViewModel = (props: PropsWithChildren) => {
  const vm = useRootPage();

  return (
    <RootPageViewModelContext.Provider value={vm}>
      {props.children}
    </RootPageViewModelContext.Provider>
  );
};
