import { type LoaderFunction, redirect } from "react-router";
import type {
  GroupDetailDto,
  GroupMemberDto,
  GetTeamResponseData,
} from "@demo-viewer/shared-types";
import { AppConfiguration } from "../../../features/configuration";

export type {
  GroupDetailDto as GroupDetail,
  GroupMemberDto as GroupMember,
  GetTeamResponseData as GroupDetailData,
};

const API = AppConfiguration.apiUrl;

// eslint-disable-next-line react-refresh/only-export-components
export const useGroupDetailViewModel = {
  loader: (async ({ params }) => {
    const { id } = params as { id: string };
    const [groupRes, membersRes] = await Promise.all([
      fetch(`${API}/team/member/${id}`, { credentials: "include" }).then((r) =>
        r.json(),
      ),
      fetch(`${API}/team/member/${id}/users`, { credentials: "include" }).then(
        (r) => r.json(),
      ),
    ]);
    return {
      group: groupRes.data as GroupDetailDto,
      members: (membersRes.data?.members ?? []) as GroupMemberDto[],
    } satisfies GetTeamResponseData;
  }) satisfies LoaderFunction,

  redirectLoader: (async ({ params }) => {
    return redirect(`/groups/${params.id}/members`);
  }) satisfies LoaderFunction,

  membersLoader: (async ({ params }) => {
    const { id } = params as { id: string };
    const res = await fetch(`${API}/team/member/${id}/users`, {
      credentials: "include",
    }).then((r) => r.json());
    return (res.data?.members ?? []) as GroupMemberDto[];
  }) satisfies LoaderFunction,

  matchesLoader: (async ({ params, request }) => {
    const { id } = params as { id: string };
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const playerFilter = url.searchParams.get("player");

    const membersRes = await fetch(`${API}/team/member/${id}/users`, {
      credentials: "include",
    }).then((r) => r.json());
    const members = (membersRes.data?.members ?? []) as GroupMemberDto[];

    const steamIds = playerFilter
      ? [playerFilter]
      : members.map((m) => m.user?.steamId).filter(Boolean);

    const steamIdsParam = steamIds.join(",");
    const matchesRes = await fetch(
      `${API}/streaming/matches/list?page=${page}&steamIds=${steamIdsParam}&groupId=${id}`,
      { credentials: "include" },
    ).then((r) => r.json());

    return {
      matches: matchesRes.data?.pagination,
      members,
      page,
      playerFilter,
    };
  }) satisfies LoaderFunction,
};
