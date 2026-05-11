export interface GroupDetailDto {
  id: string;
  name: string;
  ownerId: string;
  isOpen: boolean;
  createdAt: string;
}

export interface GroupMemberUserDto {
  id: string;
  steamId: string;
}

export interface GroupMemberDto {
  id: string;
  userId: string;
  groupId: string;
  createdAt: string;
  updatedAt: string;
  user?: GroupMemberUserDto | null;
}

export interface GetTeamResponseData {
  group: GroupDetailDto;
  members: GroupMemberDto[];
}

export interface GetTeamMembersResponseData {
  members: GroupMemberDto[];
}


export interface MyGroupsOwnedItem {
  id: string;
  name: string;
  isOpen: boolean;
  createdAt: string;
}

export interface MyGroupsJoinedItem {
  id: string;
  name: string;
  ownerId: string;
  isOpen: boolean;
  createdAt: string;
}

export interface GetMyGroupsResponseData {
  owned: MyGroupsOwnedItem[];
  joined: MyGroupsJoinedItem[];
}

export interface CreateTeamResponseData {
  id: string;
  name: string;
  ownerId: string;
  isOpen: boolean;
}

export interface UpdateTeamResponseData {
  id: string;
  name: string;
  isOpen: boolean;
}

export interface AddMemberResponseData {
  memberId: string;
}

export interface RemoveMemberResponseData {
  success: boolean;
}
