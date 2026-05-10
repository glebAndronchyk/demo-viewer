import { describe, test, expect, beforeEach } from "bun:test";
import { createTeamHandler } from "@demo-viewer/domain/src/handlers/CreateTeamHandler.ts";
import { addUserToTeamCommandHandler } from "@demo-viewer/domain/src/handlers/AddUserToTeamCommandHandler.ts";
import { removeUserFromTeamHandler } from "@demo-viewer/domain/src/handlers/RemoveUserFromTeamHandler.ts";
import { updateTeamHandler } from "@demo-viewer/domain/src/handlers/UpdateTeamHandler.ts";
import { getTeamHandler } from "@demo-viewer/domain/src/handlers/GetTeamHandler.ts";
import {
  DomainConflictError,
  DomainForbiddenError,
  DomainNotFoundError,
} from "@demo-viewer/domain/src/lib/errors/DomainErrors.ts";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const NOW = new Date("2025-01-01T00:00:00.000Z");

const makeGroup = (overrides: Partial<{ id: string; name: string; ownerId: string; isOpen: boolean }> = {}) => ({
  id: "g1",
  name: "Team Alpha",
  ownerId: "u1",
  isOpen: false,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeMember = (overrides: Partial<{ id: string; userId: string; groupId: string }> = {}) => ({
  id: "m1",
  userId: "u1",
  groupId: "g1",
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeUser = (overrides: Partial<{ id: string; steamId: string }> = {}) => ({
  id: "u2",
  steamId: "76561198000000001",
  steamIdKey: null,
  latestKnownShareCode: null,
  initialKnownShareCode: null,
  ...overrides,
});

const makeOutbound = (overrides: Record<string, unknown> = {}) =>
  ({
    teamRepository: {
      createTeam: async () => makeGroup(),
      getTeamById: async () => null,
      getTeamByOwnerId: async () => null,
      addMember: async () => makeMember(),
      removeMember: async () => {},
      getMembers: async () => [],
      isMember: async () => false,
      updateTeam: async () => makeGroup(),
    },
    userRepository: {
      getUserBySteamId: async () => null,
    },
    ...overrides,
  }) as any;

// ---------------------------------------------------------------------------
// CreateTeamHandler
// ---------------------------------------------------------------------------

describe("CreateTeamHandler", () => {
  test("happy path: no existing team — creates team, adds owner as member, returns correct shape", async () => {
    const group = makeGroup();
    const member = makeMember();

    let createTeamArgs: [string, string] | null = null;
    let addMemberArgs: [string, string] | null = null;

    const outbound = makeOutbound({
      teamRepository: {
        getTeamByOwnerId: async () => null,
        createTeam: async (name: string, ownerId: string) => {
          createTeamArgs = [name, ownerId];
          return group;
        },
        addMember: async (groupId: string, userId: string) => {
          addMemberArgs = [groupId, userId];
          return member;
        },
      },
    });

    const handler = createTeamHandler(outbound);
    const result = await handler({ type: "create_team", name: "Team Alpha", ownerId: "u1" });

    expect(result).toEqual({
      id: group.id,
      name: group.name,
      ownerId: group.ownerId,
      isOpen: group.isOpen,
    });
    expect(createTeamArgs).toEqual(["Team Alpha", "u1"]);
    expect(addMemberArgs).toEqual([group.id, "u1"]);
  });

  test("conflict: owner already has a team — throws DomainConflictError", async () => {
    const outbound = makeOutbound({
      teamRepository: {
        getTeamByOwnerId: async () => makeGroup(),
      },
    });

    const handler = createTeamHandler(outbound);
    await expect(
      handler({ type: "create_team", name: "Team Alpha", ownerId: "u1" }),
    ).rejects.toThrow(DomainConflictError);
  });

  test("conflict error has correct message", async () => {
    const outbound = makeOutbound({
      teamRepository: {
        getTeamByOwnerId: async () => makeGroup(),
      },
    });

    const handler = createTeamHandler(outbound);
    await expect(
      handler({ type: "create_team", name: "Team Alpha", ownerId: "u1" }),
    ).rejects.toThrow("User already owns a team");
  });

  test("verify addMember is called with group.id and ownerId after createTeam", async () => {
    const group = makeGroup({ id: "g99" });
    const addMemberCalls: [string, string][] = [];

    const outbound = makeOutbound({
      teamRepository: {
        getTeamByOwnerId: async () => null,
        createTeam: async () => group,
        addMember: async (groupId: string, userId: string) => {
          addMemberCalls.push([groupId, userId]);
          return makeMember({ groupId: "g99", userId: "owner99" });
        },
      },
    });

    const handler = createTeamHandler(outbound);
    await handler({ type: "create_team", name: "Test Team", ownerId: "owner99" });

    expect(addMemberCalls).toHaveLength(1);
    expect(addMemberCalls[0]).toEqual(["g99", "owner99"]);
  });
});

// ---------------------------------------------------------------------------
// AddUserToTeamCommandHandler
// ---------------------------------------------------------------------------

describe("AddUserToTeamCommandHandler", () => {
  test("happy path: team exists, requester is owner, user found — returns { memberId }", async () => {
    const group = makeGroup({ ownerId: "owner1" });
    const user = makeUser({ id: "u2", steamId: "steam2" });
    const member = makeMember({ id: "m5", userId: "u2", groupId: "g1" });

    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => group,
        addMember: async () => member,
      },
      userRepository: {
        getUserBySteamId: async () => user,
      },
    });

    const handler = addUserToTeamCommandHandler(outbound);
    const result = await handler({
      type: "add_user_to_team",
      groupId: "g1",
      steamId: "steam2",
      requesterId: "owner1",
    });

    expect(result).toEqual({ memberId: "m5" });
  });

  test("team not found — throws DomainNotFoundError", async () => {
    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => null,
      },
    });

    const handler = addUserToTeamCommandHandler(outbound);
    await expect(
      handler({ type: "add_user_to_team", groupId: "missing", steamId: "steam2", requesterId: "owner1" }),
    ).rejects.toThrow(DomainNotFoundError);
  });

  test("requester is not owner — throws DomainForbiddenError", async () => {
    const group = makeGroup({ ownerId: "actual-owner" });

    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => group,
      },
    });

    const handler = addUserToTeamCommandHandler(outbound);
    await expect(
      handler({ type: "add_user_to_team", groupId: "g1", steamId: "steam2", requesterId: "not-the-owner" }),
    ).rejects.toThrow(DomainForbiddenError);
  });

  test("requester is not owner — error has correct message", async () => {
    const group = makeGroup({ ownerId: "actual-owner" });

    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => group,
      },
    });

    const handler = addUserToTeamCommandHandler(outbound);
    await expect(
      handler({ type: "add_user_to_team", groupId: "g1", steamId: "steam2", requesterId: "not-the-owner" }),
    ).rejects.toThrow("Only the team owner can invite members");
  });

  test("user not found by steamId — throws DomainNotFoundError", async () => {
    const group = makeGroup({ ownerId: "owner1" });

    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => group,
      },
      userRepository: {
        getUserBySteamId: async () => null,
      },
    });

    const handler = addUserToTeamCommandHandler(outbound);
    await expect(
      handler({ type: "add_user_to_team", groupId: "g1", steamId: "ghost-steam", requesterId: "owner1" }),
    ).rejects.toThrow(DomainNotFoundError);
  });
});

// ---------------------------------------------------------------------------
// RemoveUserFromTeamHandler
// ---------------------------------------------------------------------------

describe("RemoveUserFromTeamHandler", () => {
  test("happy path: team exists, requester is owner, userId ≠ requesterId — returns { success: true }", async () => {
    const group = makeGroup({ ownerId: "owner1" });

    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => group,
        removeMember: async () => {},
      },
    });

    const handler = removeUserFromTeamHandler(outbound);
    const result = await handler({
      type: "remove_user_from_team",
      groupId: "g1",
      userId: "member1",
      requesterId: "owner1",
    });

    expect(result).toEqual({ success: true });
  });

  test("team not found — throws DomainNotFoundError", async () => {
    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => null,
      },
    });

    const handler = removeUserFromTeamHandler(outbound);
    await expect(
      handler({ type: "remove_user_from_team", groupId: "missing", userId: "member1", requesterId: "owner1" }),
    ).rejects.toThrow(DomainNotFoundError);
  });

  test("requester is not the owner — throws DomainForbiddenError", async () => {
    const group = makeGroup({ ownerId: "actual-owner" });

    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => group,
      },
    });

    const handler = removeUserFromTeamHandler(outbound);
    await expect(
      handler({ type: "remove_user_from_team", groupId: "g1", userId: "member1", requesterId: "not-the-owner" }),
    ).rejects.toThrow(DomainForbiddenError);
  });

  test("requester is not the owner — error has correct message", async () => {
    const group = makeGroup({ ownerId: "actual-owner" });

    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => group,
      },
    });

    const handler = removeUserFromTeamHandler(outbound);
    await expect(
      handler({ type: "remove_user_from_team", groupId: "g1", userId: "member1", requesterId: "not-the-owner" }),
    ).rejects.toThrow("Only the team owner can remove members");
  });

  test("owner tries to remove themselves — throws DomainConflictError", async () => {
    const group = makeGroup({ ownerId: "owner1" });

    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => group,
      },
    });

    const handler = removeUserFromTeamHandler(outbound);
    await expect(
      handler({ type: "remove_user_from_team", groupId: "g1", userId: "owner1", requesterId: "owner1" }),
    ).rejects.toThrow(DomainConflictError);
  });

  test("owner tries to remove themselves — error has correct message", async () => {
    const group = makeGroup({ ownerId: "owner1" });

    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => group,
      },
    });

    const handler = removeUserFromTeamHandler(outbound);
    await expect(
      handler({ type: "remove_user_from_team", groupId: "g1", userId: "owner1", requesterId: "owner1" }),
    ).rejects.toThrow("Owner cannot remove themselves from the team");
  });
});

// ---------------------------------------------------------------------------
// UpdateTeamHandler
// ---------------------------------------------------------------------------

describe("UpdateTeamHandler", () => {
  test("happy path: team found, requester is owner — calls updateTeam, returns { id, name, isOpen }", async () => {
    const group = makeGroup({ ownerId: "owner1" });
    const updated = makeGroup({ name: "Renamed Team", isOpen: true });

    let updateTeamArgs: [string, { name?: string; isOpen?: boolean }] | null = null;

    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => group,
        updateTeam: async (id: string, updates: { name?: string; isOpen?: boolean }) => {
          updateTeamArgs = [id, updates];
          return updated;
        },
      },
    });

    const handler = updateTeamHandler(outbound);
    const result = await handler({
      type: "update_team",
      groupId: "g1",
      requesterId: "owner1",
      name: "Renamed Team",
      isOpen: true,
    });

    expect(result).toEqual({
      id: updated.id,
      name: updated.name,
      isOpen: updated.isOpen,
    });
    expect(updateTeamArgs).toEqual(["g1", { name: "Renamed Team", isOpen: true }]);
  });

  test("team not found — throws DomainNotFoundError", async () => {
    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => null,
      },
    });

    const handler = updateTeamHandler(outbound);
    await expect(
      handler({ type: "update_team", groupId: "missing", requesterId: "owner1" }),
    ).rejects.toThrow(DomainNotFoundError);
  });

  test("requester is not the owner — throws DomainForbiddenError", async () => {
    const group = makeGroup({ ownerId: "actual-owner" });

    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => group,
      },
    });

    const handler = updateTeamHandler(outbound);
    await expect(
      handler({ type: "update_team", groupId: "g1", requesterId: "not-the-owner", name: "Hacked" }),
    ).rejects.toThrow(DomainForbiddenError);
  });

  test("requester is not the owner — error has correct message", async () => {
    const group = makeGroup({ ownerId: "actual-owner" });

    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => group,
      },
    });

    const handler = updateTeamHandler(outbound);
    await expect(
      handler({ type: "update_team", groupId: "g1", requesterId: "not-the-owner" }),
    ).rejects.toThrow("Only the team owner can update team info");
  });
});

// ---------------------------------------------------------------------------
// GetTeamHandler
// ---------------------------------------------------------------------------

describe("GetTeamHandler", () => {
  test("happy path: is member, team found — returns { id, name, ownerId, isOpen, createdAt }", async () => {
    const group = makeGroup();

    const outbound = makeOutbound({
      teamRepository: {
        isMember: async () => true,
        getTeamById: async () => group,
      },
    });

    const handler = getTeamHandler(outbound);
    const result = await handler({ type: "get_team", groupId: "g1", requesterId: "u1" });

    expect(result).toEqual({
      id: group.id,
      name: group.name,
      ownerId: group.ownerId,
      isOpen: group.isOpen,
      createdAt: group.createdAt,
    });
  });

  test("not a member — throws DomainForbiddenError (before getTeamById is called)", async () => {
    let getTeamByIdCalled = false;

    const outbound = makeOutbound({
      teamRepository: {
        isMember: async () => false,
        getTeamById: async () => {
          getTeamByIdCalled = true;
          return makeGroup();
        },
      },
    });

    const handler = getTeamHandler(outbound);
    await expect(
      handler({ type: "get_team", groupId: "g1", requesterId: "outsider" }),
    ).rejects.toThrow(DomainForbiddenError);

    expect(getTeamByIdCalled).toBe(false);
  });

  test("not a member — error has correct message", async () => {
    const outbound = makeOutbound({
      teamRepository: {
        isMember: async () => false,
      },
    });

    const handler = getTeamHandler(outbound);
    await expect(
      handler({ type: "get_team", groupId: "g1", requesterId: "outsider" }),
    ).rejects.toThrow("You are not a member of this team");
  });

  test("is member but team not found (data inconsistency) — throws DomainNotFoundError", async () => {
    const outbound = makeOutbound({
      teamRepository: {
        isMember: async () => true,
        getTeamById: async () => null,
      },
    });

    const handler = getTeamHandler(outbound);
    await expect(
      handler({ type: "get_team", groupId: "g1", requesterId: "u1" }),
    ).rejects.toThrow(DomainNotFoundError);
  });
});
