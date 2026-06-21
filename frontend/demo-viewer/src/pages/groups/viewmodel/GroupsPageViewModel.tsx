import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";
import { type LoaderFunction, redirect, useNavigate } from "react-router";
import { AppConfiguration } from "../../../features/configuration";

export interface GroupSummary {
  id: string;
  name: string;
  isOpen: boolean;
  createdAt: string;
}

export interface JoinedGroupSummary extends GroupSummary {
  ownerId: string;
}

export interface MyGroupsData {
  owned: GroupSummary[];
  joined: JoinedGroupSummary[];
}

const useGroupsPage = () => {
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => setCreateModalOpen(false);

  const createGroup = async (name: string) => {
    const res = await fetch(`${AppConfiguration.apiUrl}/team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name }),
    }).then((r) => r.json());

    if (res.isSuccess) {
      closeCreateModal();
      navigate(`/groups/${res.data.id}`);
    }
  };

  return { createModalOpen, openCreateModal, closeCreateModal, createGroup };
};

const GroupsPageViewModelContext = createContext<
  ReturnType<typeof useGroupsPage>
>(null as never);

// eslint-disable-next-line react-refresh/only-export-components
export const useGroupsPageViewModel = Object.assign(
  () => useContext(GroupsPageViewModelContext),
  {
    loader: (async () => {
      const res = await fetch(`${AppConfiguration.apiUrl}/team/my`, {
        credentials: "include",
      }).then((r) => r.json());
      return res.data as MyGroupsData;
    }) satisfies LoaderFunction,

    redirectLoader: (async (args) => {
      const res = await fetch(`${AppConfiguration.apiUrl}/team/my`, {
        credentials: "include",
      }).then((r) => r.json());
      const data = res.data as MyGroupsData;
      const first = data.owned[0] ?? data.joined[0];
      if (first) {
        const url = new URL(args.request.url);
        return redirect(`/groups/${first.id}${url.search}`);
      }
      return null;
    }) satisfies LoaderFunction,
  },
);

export const GroupsPageViewModel = (props: PropsWithChildren) => {
  const vm = useGroupsPage();
  return (
    <GroupsPageViewModelContext.Provider value={vm}>
      {props.children}
    </GroupsPageViewModelContext.Provider>
  );
};
