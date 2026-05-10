import { describe, test, expect } from "bun:test";
import { getTeamMembersHandler } from "@demo-viewer/domain/src/handlers/GetTeamMembersHandler.ts";
import { sendGroupInvitationCommandHandler } from "@demo-viewer/domain/src/handlers/SendGroupInvitationCommandHandler.ts";
import { processPendingNotificationsCommandHandler } from "@demo-viewer/domain/src/handlers/ProcessPendingNotificationsCommandHandler.ts";
import { getSteamFriendsCommandHandler } from "@demo-viewer/domain/src/handlers/GetSteamFriendsCommandHandler.ts";
import { linkMatchesToUserHandler } from "@demo-viewer/domain/src/handlers/LinkMatchesToUserHandler.ts";
import {
  DomainForbiddenError,
  DomainNotFoundError,
  DomainConflictError,
} from "@demo-viewer/domain/src/lib/errors/DomainErrors.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeDate = () => new Date("2024-01-01T00:00:00Z");

const makeOutbound = (overrides: any = {}) => ({
  teamRepository: {
    isMember: async () => true,
    getMembers: async () => [],
    getTeamById: async () => null,
    addMember: async () => ({
      id: "m1",
      userId: "u1",
      groupId: "g1",
      createdAt: makeDate(),
      updatedAt: makeDate(),
    }),
    ...overrides.teamRepository,
  },
  userRepository: {
    getUserBySteamId: async () => null,
    ...overrides.userRepository,
  },
  notificationRepository: {
    createNotification: async (d: any) => ({
      ...d,
      id: "n1",
      createdAt: makeDate(),
      updatedAt: makeDate(),
    }),
    getPendingNotifications: async () => [],
    markAsDelivered: async () => {},
    hasPendingInvitation: async () => false,
    ...overrides.notificationRepository,
  },
  steamFriendsRepository: {
    getFriendsOf: async () => [],
    ...overrides.steamFriendsRepository,
  },
  authRepository: {
    linkMatchesToUser: async () => 0,
    ...overrides.authRepository,
  },
} as any);

// ---------------------------------------------------------------------------
// GetTeamMembersHandler
// ---------------------------------------------------------------------------

describe("GetTeamMembersHandler", () => {
  const baseCommand = {
    type: "get_team_members" as const,
    groupId: "g1",
    requesterId: "u1",
  };

  test("happy path: is member, returns mapped members", async () => {
    const joinedAt = makeDate();
    const outbound = makeOutbound({
      teamRepository: {
        isMember: async () => true,
        getMembers: async () => [
          { id: "m1", userId: "u1", groupId: "g1", createdAt: joinedAt, updatedAt: makeDate() },
          { id: "m2", userId: "u2", groupId: "g1", createdAt: joinedAt, updatedAt: makeDate() },
        ],
      },
    });
    const handler = getTeamMembersHandler(outbound);
    const result = await handler(baseCommand);
    expect(result.members).toHaveLength(2);
    expect(result.members[0]).toEqual({ memberId: "m1", userId: "u1", joinedAt });
    expect(result.members[1]).toEqual({ memberId: "m2", userId: "u2", joinedAt });
  });

  test("not a member: throws DomainForbiddenError", async () => {
    const outbound = makeOutbound({
      teamRepository: { isMember: async () => false },
    });
    const handler = getTeamMembersHandler(outbound);
    await expect(handler(baseCommand)).rejects.toThrow(DomainForbiddenError);
    await expect(handler(baseCommand)).rejects.toThrow("You are not a member of this team");
  });

  test("empty members list: is member, returns { members: [] }", async () => {
    const outbound = makeOutbound({
      teamRepository: {
        isMember: async () => true,
        getMembers: async () => [],
      },
    });
    const handler = getTeamMembersHandler(outbound);
    const result = await handler(baseCommand);
    expect(result.members).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// SendGroupInvitationCommandHandler
// ---------------------------------------------------------------------------

describe("SendGroupInvitationCommandHandler", () => {
  const baseCommand = {
    type: "send_group_invitation" as const,
    requesterId: "owner1",
    requesterSteamId: "steam_owner",
    targetSteamId: "steam_target",
    groupId: "g1",
  };

  const makeGroup = (ownerId = "owner1") => ({
    id: "g1",
    name: "Team A",
    ownerId,
    isOpen: false,
    createdAt: makeDate(),
    updatedAt: makeDate(),
  });

  const makeUser = (id = "user_target", steamId = "steam_target") => ({
    id,
    steamId,
    steamIdKey: null,
    latestKnownShareCode: null,
    initialKnownShareCode: null,
  });

  test("happy path: all checks pass, creates notification, returns { notificationId }", async () => {
    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => makeGroup("owner1"),
      },
      steamFriendsRepository: {
        getFriendsOf: async () => ["steam_target", "steam_other"],
      },
      userRepository: {
        getUserBySteamId: async () => makeUser(),
      },
      notificationRepository: {
        hasPendingInvitation: async () => false,
        createNotification: async (d: any) => ({
          ...d,
          id: "notif_123",
          createdAt: makeDate(),
          updatedAt: makeDate(),
        }),
      },
    });
    const handler = sendGroupInvitationCommandHandler(outbound);
    const result = await handler(baseCommand);
    expect(result).toEqual({ notificationId: "notif_123" });
  });

  test("team not found: throws DomainNotFoundError", async () => {
    const outbound = makeOutbound({
      teamRepository: { getTeamById: async () => null },
    });
    const handler = sendGroupInvitationCommandHandler(outbound);
    await expect(handler(baseCommand)).rejects.toThrow(DomainNotFoundError);
  });

  test("requester is not owner: throws DomainForbiddenError", async () => {
    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => makeGroup("someone_else"),
      },
    });
    const handler = sendGroupInvitationCommandHandler(outbound);
    await expect(handler(baseCommand)).rejects.toThrow(DomainForbiddenError);
    await expect(handler(baseCommand)).rejects.toThrow("Only the team owner can invite members");
  });

  test("target not in friends list: throws DomainForbiddenError", async () => {
    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => makeGroup("owner1"),
      },
      steamFriendsRepository: {
        getFriendsOf: async () => ["steam_someone_else"],
      },
    });
    const handler = sendGroupInvitationCommandHandler(outbound);
    await expect(handler(baseCommand)).rejects.toThrow(DomainForbiddenError);
    await expect(handler(baseCommand)).rejects.toThrow(
      "Target user is not in your Steam friends list",
    );
  });

  test("target user not registered: throws DomainNotFoundError", async () => {
    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => makeGroup("owner1"),
      },
      steamFriendsRepository: {
        getFriendsOf: async () => ["steam_target"],
      },
      userRepository: {
        getUserBySteamId: async () => null,
      },
    });
    const handler = sendGroupInvitationCommandHandler(outbound);
    await expect(handler(baseCommand)).rejects.toThrow(DomainNotFoundError);
  });

  test("already has pending invitation: throws DomainConflictError", async () => {
    const outbound = makeOutbound({
      teamRepository: {
        getTeamById: async () => makeGroup("owner1"),
      },
      steamFriendsRepository: {
        getFriendsOf: async () => ["steam_target"],
      },
      userRepository: {
        getUserBySteamId: async () => makeUser(),
      },
      notificationRepository: {
        hasPendingInvitation: async () => true,
      },
    });
    const handler = sendGroupInvitationCommandHandler(outbound);
    await expect(handler(baseCommand)).rejects.toThrow(DomainConflictError);
    await expect(handler(baseCommand)).rejects.toThrow(
      "A pending invitation already exists for this user and group",
    );
  });
});

// ---------------------------------------------------------------------------
// ProcessPendingNotificationsCommandHandler
// ---------------------------------------------------------------------------

describe("ProcessPendingNotificationsCommandHandler", () => {
  const baseCommand = {
    type: "process_pending_notifications" as const,
    batchSize: 10,
  };

  const makeNotification = (id: string, type = "group_invitation", groupId = "g1") => ({
    id,
    type,
    recipientUserId: `user_${id}`,
    payload: { groupId, invitedBy: "owner1" },
    status: "pending" as const,
    createdAt: makeDate(),
    updatedAt: makeDate(),
  });

  test("happy path: 3 group_invitation notifications, all processed", async () => {
    const addMemberCalls: string[] = [];
    const markDeliveredCalls: string[] = [];

    const notifications = [
      makeNotification("n1"),
      makeNotification("n2"),
      makeNotification("n3"),
    ];

    const outbound = makeOutbound({
      notificationRepository: {
        getPendingNotifications: async () => notifications,
        markAsDelivered: async (id: string) => { markDeliveredCalls.push(id); },
        hasPendingInvitation: async () => false,
      },
      teamRepository: {
        addMember: async (_groupId: string, userId: string) => {
          addMemberCalls.push(userId);
          return { id: "m1", userId, groupId: "g1", createdAt: makeDate(), updatedAt: makeDate() };
        },
      },
    });

    const handler = processPendingNotificationsCommandHandler(outbound);
    const result = await handler(baseCommand);

    expect(result.processed).toBe(3);
    expect(addMemberCalls).toHaveLength(3);
    expect(markDeliveredCalls).toHaveLength(3);
    expect(markDeliveredCalls).toContain("n1");
    expect(markDeliveredCalls).toContain("n2");
    expect(markDeliveredCalls).toContain("n3");
  });

  test("empty batch: no pending notifications, returns { processed: 0 }", async () => {
    const outbound = makeOutbound({
      notificationRepository: {
        getPendingNotifications: async () => [],
      },
    });
    const handler = processPendingNotificationsCommandHandler(outbound);
    const result = await handler(baseCommand);
    expect(result.processed).toBe(0);
  });

  test("partial failure: one notification throws, error swallowed, others still processed", async () => {
    const markDeliveredCalls: string[] = [];
    const notifications = [
      makeNotification("n1"),
      makeNotification("n2"),
      makeNotification("n3"),
    ];

    let callCount = 0;
    const outbound = makeOutbound({
      notificationRepository: {
        getPendingNotifications: async () => notifications,
        markAsDelivered: async (id: string) => { markDeliveredCalls.push(id); },
      },
      teamRepository: {
        addMember: async () => {
          callCount++;
          if (callCount === 2) {
            throw new Error("Simulated failure for n2");
          }
          return { id: "m1", userId: "u1", groupId: "g1", createdAt: makeDate(), updatedAt: makeDate() };
        },
      },
    });

    const handler = processPendingNotificationsCommandHandler(outbound);
    const result = await handler(baseCommand);

    // n2 fails so only n1 and n3 are processed
    expect(result.processed).toBe(2);
    expect(markDeliveredCalls).toHaveLength(2);
    expect(markDeliveredCalls).toContain("n1");
    expect(markDeliveredCalls).toContain("n3");
    expect(markDeliveredCalls).not.toContain("n2");
  });

  test("non-group-invitation type: markAsDelivered still called, processed++", async () => {
    const addMemberCalls: string[] = [];
    const markDeliveredCalls: string[] = [];

    const notifications = [makeNotification("n1", "some_other_type")];

    const outbound = makeOutbound({
      notificationRepository: {
        getPendingNotifications: async () => notifications,
        markAsDelivered: async (id: string) => { markDeliveredCalls.push(id); },
      },
      teamRepository: {
        addMember: async (_groupId: string, userId: string) => {
          addMemberCalls.push(userId);
          return { id: "m1", userId, groupId: "g1", createdAt: makeDate(), updatedAt: makeDate() };
        },
      },
    });

    const handler = processPendingNotificationsCommandHandler(outbound);
    const result = await handler(baseCommand);

    expect(result.processed).toBe(1);
    expect(addMemberCalls).toHaveLength(0);
    expect(markDeliveredCalls).toHaveLength(1);
    expect(markDeliveredCalls).toContain("n1");
  });
});

// ---------------------------------------------------------------------------
// GetSteamFriendsCommandHandler
// ---------------------------------------------------------------------------

describe("GetSteamFriendsCommandHandler", () => {
  const baseCommand = {
    type: "get_steam_friends" as const,
    requesterSteamId: "steam_me",
  };

  test("happy path: returns friend steam IDs", async () => {
    const friends = ["steam_a", "steam_b", "steam_c"];
    const outbound = makeOutbound({
      steamFriendsRepository: {
        getFriendsOf: async () => friends,
      },
    });
    const handler = getSteamFriendsCommandHandler(outbound);
    const result = await handler(baseCommand);
    expect(result).toEqual({ steamIds: friends });
  });

  test("empty friends list: returns { steamIds: [] }", async () => {
    const outbound = makeOutbound({
      steamFriendsRepository: {
        getFriendsOf: async () => [],
      },
    });
    const handler = getSteamFriendsCommandHandler(outbound);
    const result = await handler(baseCommand);
    expect(result).toEqual({ steamIds: [] });
  });
});

// ---------------------------------------------------------------------------
// LinkMatchesToUserHandler
// ---------------------------------------------------------------------------

describe("LinkMatchesToUserHandler", () => {
  const baseCommand = {
    type: "link_matches_to_user" as const,
    steamId: "steam_abc",
    userId: "user_123",
  };

  test("happy path: returns { linkedCount: 5 }", async () => {
    const outbound = makeOutbound({
      authRepository: {
        linkMatchesToUser: async () => 5,
      },
    });
    const handler = linkMatchesToUserHandler(outbound);
    const result = await handler(baseCommand);
    expect(result).toEqual({ linkedCount: 5 });
  });

  test("zero linked: no matches found for that steamId, returns { linkedCount: 0 }", async () => {
    const outbound = makeOutbound({
      authRepository: {
        linkMatchesToUser: async () => 0,
      },
    });
    const handler = linkMatchesToUserHandler(outbound);
    const result = await handler(baseCommand);
    expect(result).toEqual({ linkedCount: 0 });
  });
});
