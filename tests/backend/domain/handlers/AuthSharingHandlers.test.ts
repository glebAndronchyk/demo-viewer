import { describe, test, expect, beforeEach } from "bun:test";
import { registerOrLoginWithSteamHandler } from "@demo-viewer/domain/src/handlers/RegisterOrLoginWithSteamHandler.ts";
import { setUserSharingDataCommandHandler } from "@demo-viewer/domain/src/handlers/SetUserSharingDataCommandHandler.ts";
import { updateUserSharingDataCommandHandler } from "@demo-viewer/domain/src/handlers/UpdateUserSharingDataCommandHandler.ts";
import { getUserNextAvailableShareCodeCommandHandler } from "@demo-viewer/domain/src/handlers/GetUserNextAvailableShareCodeCommandHandler.ts";
import { seekNextAvailableCodeOfNextUsersCommandHandler } from "@demo-viewer/domain/src/handlers/SeekNextAvailableCodeOfNextUsersCommandHandler.ts";
import {
  DomainConflictError,
  DomainNotFoundError,
} from "@demo-viewer/domain/src/lib/errors/DomainErrors.ts";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const NOW = new Date("2025-01-01T00:00:00.000Z");

const makeUserRecord = (overrides: Partial<{ id: string; steam_id: string }> = {}) => ({
  id: "user-1",
  steam_id: "76561198000000001",
  createdAt: NOW,
  ...overrides,
});

const makeUserEntity = (
  overrides: Partial<{
    id: string;
    steamId: string;
    steamIdKey: string | null;
    latestKnownShareCode: string | null;
    initialKnownShareCode: string | null;
  }> = {},
) => ({
  id: "user-1",
  steamId: "76561198000000001",
  steamIdKey: null,
  latestKnownShareCode: null,
  initialKnownShareCode: null,
  shareCodeVerifiedAt: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeOutbound = (overrides: Record<string, unknown> = {}) =>
  ({
    authRepository: {
      findUserBySteamId: async () => null,
      createUser: async () => makeUserRecord(),
      linkMatchesToUser: async () => 0,
      signJwt: async () => "signed-token",
    },
    userRepository: {
      getUserById: async () => null,
      setUserSharingData: async () => makeUserEntity(),
      updateKnownShareCode: async () => {},
      getUsersWithSharingData: async () => [],
      getUserBySteamId: async () => null,
      resetUserShareCode: async () => {},
    },
    gameCoordinatorRepository: {
      getNextAvailableShareCode: async () => ({
        isSuccess: true,
        data: { nextCode: "CSGO-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" },
      }),
      decodeShareCode: async () => ({ isSuccess: true, data: { matchId: "" } }),
      getMatchUrlById: async () => ({ isSuccess: true, data: { url: "" } }),
      downloadMatchById: async () => ({ isSuccess: true, data: { path: "" } }),
      pingMatchUrl: async () => ({ isSuccess: true }),
    },
    configuration: {
      shareCodeSeekStep: 10,
    },
    ...overrides,
  }) as any;

// ---------------------------------------------------------------------------
// RegisterOrLoginWithSteamHandler
// ---------------------------------------------------------------------------

describe("RegisterOrLoginWithSteamHandler", () => {
  test("new user: findUserBySteamId returns null — createUser is called, isNewUser=true, token returned", async () => {
    const newUser = makeUserRecord({ id: "new-user-1", steam_id: "76561198000000002" });
    let createUserCalled = false;

    const outbound = makeOutbound({
      authRepository: {
        findUserBySteamId: async () => null,
        createUser: async (steamId: string) => {
          createUserCalled = true;
          return newUser;
        },
        signJwt: async () => "new-user-token",
      },
    });

    const handler = registerOrLoginWithSteamHandler(outbound);
    const result = await handler({
      type: "register_or_login_with_steam",
      steamId: "76561198000000002",
    });

    expect(createUserCalled).toBe(true);
    expect(result.isNewUser).toBe(true);
    expect(result.token).toBe("new-user-token");
  });

  test("existing user: findUserBySteamId returns user — createUser NOT called, isNewUser=false", async () => {
    const existingUser = makeUserRecord({ id: "existing-user-1", steam_id: "76561198000000001" });
    let createUserCalled = false;

    const outbound = makeOutbound({
      authRepository: {
        findUserBySteamId: async () => existingUser,
        createUser: async () => {
          createUserCalled = true;
          return makeUserRecord();
        },
        signJwt: async () => "existing-token",
      },
    });

    const handler = registerOrLoginWithSteamHandler(outbound);
    const result = await handler({
      type: "register_or_login_with_steam",
      steamId: "76561198000000001",
    });

    expect(createUserCalled).toBe(false);
    expect(result.isNewUser).toBe(false);
  });

  test("token is signed with correct payload: { sub: user.id, steamId: user.steam_id }", async () => {
    const user = makeUserRecord({ id: "u-42", steam_id: "76561198000000099" });
    let signedPayload: { sub: string; steamId: string } | null = null;

    const outbound = makeOutbound({
      authRepository: {
        findUserBySteamId: async () => user,
        signJwt: async (payload: { sub: string; steamId: string }) => {
          signedPayload = payload;
          return "token-42";
        },
      },
    });

    const handler = registerOrLoginWithSteamHandler(outbound);
    await handler({ type: "register_or_login_with_steam", steamId: "76561198000000099" });

    expect(signedPayload).toEqual({ sub: "u-42", steamId: "76561198000000099" });
  });

  test("result shape: userId, steamId, isNewUser, token all present", async () => {
    const user = makeUserRecord({ id: "u-shape", steam_id: "76561198000000003" });

    const outbound = makeOutbound({
      authRepository: {
        findUserBySteamId: async () => user,
        signJwt: async () => "shape-token",
      },
    });

    const handler = registerOrLoginWithSteamHandler(outbound);
    const result = await handler({
      type: "register_or_login_with_steam",
      steamId: "76561198000000003",
    });

    expect(result).toMatchObject({
      userId: "u-shape",
      steamId: "76561198000000003",
      isNewUser: false,
      token: "shape-token",
    });
  });
});

// ---------------------------------------------------------------------------
// SetUserSharingDataCommandHandler
// ---------------------------------------------------------------------------

describe("SetUserSharingDataCommandHandler", () => {
  test("happy path: user found, both sharing fields null — sets sharing data, returns { success: true }", async () => {
    const user = makeUserEntity({ id: "u1", steamIdKey: null, initialKnownShareCode: null });
    let setDataCalled = false;

    const outbound = makeOutbound({
      userRepository: {
        getUserById: async () => user,
        setUserSharingData: async () => {
          setDataCalled = true;
          return makeUserEntity();
        },
      },
    });

    const handler = setUserSharingDataCommandHandler(outbound);
    const result = await handler({
      type: "set_user_sharing_data",
      userId: "u1",
      steamIdKey: "STEAM_KEY_ABC",
      knownShareCode: "CSGO-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
    });

    expect(result).toEqual({ success: true });
    expect(setDataCalled).toBe(true);
  });

  test("user not found — throws DomainNotFoundError", async () => {
    const outbound = makeOutbound({
      userRepository: {
        getUserById: async () => null,
      },
    });

    const handler = setUserSharingDataCommandHandler(outbound);
    await expect(
      handler({
        type: "set_user_sharing_data",
        userId: "missing-user",
        steamIdKey: "STEAM_KEY",
        knownShareCode: "CSGO-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
      }),
    ).rejects.toThrow(DomainNotFoundError);
  });

  test("already configured (both initialKnownShareCode and steamIdKey set) — throws DomainConflictError", async () => {
    const user = makeUserEntity({
      id: "u1",
      steamIdKey: "EXISTING_KEY",
      initialKnownShareCode: "CSGO-EXIST-EXIST-EXIST-EXIST-EXIST",
    });

    const outbound = makeOutbound({
      userRepository: {
        getUserById: async () => user,
      },
    });

    const handler = setUserSharingDataCommandHandler(outbound);
    await expect(
      handler({
        type: "set_user_sharing_data",
        userId: "u1",
        steamIdKey: "NEW_KEY",
        knownShareCode: "CSGO-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
      }),
    ).rejects.toThrow(DomainConflictError);
  });

  test("conflict error has correct message", async () => {
    const user = makeUserEntity({
      id: "u1",
      steamIdKey: "EXISTING_KEY",
      initialKnownShareCode: "CSGO-EXIST-EXIST-EXIST-EXIST-EXIST",
    });

    const outbound = makeOutbound({
      userRepository: {
        getUserById: async () => user,
      },
    });

    const handler = setUserSharingDataCommandHandler(outbound);
    await expect(
      handler({
        type: "set_user_sharing_data",
        userId: "u1",
        steamIdKey: "NEW_KEY",
        knownShareCode: "CSGO-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
      }),
    ).rejects.toThrow("Sharing data already configured for this user");
  });

  test("partial config — only steamIdKey set (initialKnownShareCode is null) — should proceed, NOT throw conflict", async () => {
    const user = makeUserEntity({
      id: "u1",
      steamIdKey: "EXISTING_KEY",
      initialKnownShareCode: null,
    });

    const outbound = makeOutbound({
      userRepository: {
        getUserById: async () => user,
        setUserSharingData: async () => makeUserEntity(),
      },
    });

    const handler = setUserSharingDataCommandHandler(outbound);
    const result = await handler({
      type: "set_user_sharing_data",
      userId: "u1",
      steamIdKey: "NEW_KEY",
      knownShareCode: "CSGO-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
    });

    expect(result).toEqual({ success: true });
  });

  test("partial config — only initialKnownShareCode set (steamIdKey is null) — should proceed, NOT throw conflict", async () => {
    const user = makeUserEntity({
      id: "u1",
      steamIdKey: null,
      initialKnownShareCode: "CSGO-EXIST-EXIST-EXIST-EXIST-EXIST",
    });

    const outbound = makeOutbound({
      userRepository: {
        getUserById: async () => user,
        setUserSharingData: async () => makeUserEntity(),
      },
    });

    const handler = setUserSharingDataCommandHandler(outbound);
    const result = await handler({
      type: "set_user_sharing_data",
      userId: "u1",
      steamIdKey: "NEW_KEY",
      knownShareCode: "CSGO-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
    });

    expect(result).toEqual({ success: true });
  });
});

// ---------------------------------------------------------------------------
// UpdateUserSharingDataCommandHandler
// ---------------------------------------------------------------------------

describe("UpdateUserSharingDataCommandHandler", () => {
  test("happy path: user found — calls setUserSharingData, returns { success: true }", async () => {
    const user = makeUserEntity({ id: "u1" });
    let setDataArgs: { id: string; steamIdKey: string; knownShareCode: string } | null = null;

    const outbound = makeOutbound({
      userRepository: {
        getUserById: async () => user,
        setUserSharingData: async (payload: { id: string; steamIdKey: string; knownShareCode: string }) => {
          setDataArgs = payload;
          return makeUserEntity();
        },
      },
    });

    const handler = updateUserSharingDataCommandHandler(outbound);
    const result = await handler({
      type: "update_user_sharing_data",
      userId: "u1",
      steamIdKey: "UPDATED_KEY",
      knownShareCode: "CSGO-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
    });

    expect(result).toEqual({ success: true });
    expect(setDataArgs).toEqual({
      id: "u1",
      steamIdKey: "UPDATED_KEY",
      knownShareCode: "CSGO-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
    });
  });

  test("user not found — throws DomainNotFoundError", async () => {
    const outbound = makeOutbound({
      userRepository: {
        getUserById: async () => null,
      },
    });

    const handler = updateUserSharingDataCommandHandler(outbound);
    await expect(
      handler({
        type: "update_user_sharing_data",
        userId: "missing-user",
        steamIdKey: "KEY",
        knownShareCode: "CSGO-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
      }),
    ).rejects.toThrow(DomainNotFoundError);
  });

  test("no conflict check: user already has sharing data configured — succeeds without DomainConflictError", async () => {
    const user = makeUserEntity({
      id: "u1",
      steamIdKey: "EXISTING_KEY",
      initialKnownShareCode: "CSGO-EXIST-EXIST-EXIST-EXIST-EXIST",
    });

    const outbound = makeOutbound({
      userRepository: {
        getUserById: async () => user,
        setUserSharingData: async () => makeUserEntity(),
      },
    });

    const handler = updateUserSharingDataCommandHandler(outbound);
    const result = await handler({
      type: "update_user_sharing_data",
      userId: "u1",
      steamIdKey: "NEW_KEY",
      knownShareCode: "CSGO-NEW-NEW-NEW-NEW-NEW",
    });

    expect(result).toEqual({ success: true });
  });
});

// ---------------------------------------------------------------------------
// GetUserNextAvailableShareCodeCommandHandler
// ---------------------------------------------------------------------------

describe("GetUserNextAvailableShareCodeCommandHandler", () => {
  test("happy path: user found, has latestKnownShareCode and steamIdKey — calls getNextAvailableShareCode, updates code, returns shareCode", async () => {
    const user = makeUserEntity({
      id: "u1",
      steamId: "76561198000000001",
      steamIdKey: "STEAM_KEY_ABC",
      latestKnownShareCode: "CSGO-LATEST-XXXXX-XXXXX-XXXXX-XXXXX",
      initialKnownShareCode: "CSGO-INITIAL-XXXXX-XXXXX-XXXXX-XXXXX",
    });

    let getCodeArgs: [string, string, string] | null = null;
    let updateCodeArgs: [string, string] | null = null;
    const nextCode = "CSGO-NEXT-NEXT-NEXT-NEXT-NEXT";

    const outbound = makeOutbound({
      userRepository: {
        getUserById: async () => user,
        updateKnownShareCode: async (id: string, code: string) => {
          updateCodeArgs = [id, code];
        },
      },
      gameCoordinatorRepository: {
        getNextAvailableShareCode: async (steamId: string, steamIdKey: string, lastCode: string) => {
          getCodeArgs = [steamId, steamIdKey, lastCode];
          return { isSuccess: true, data: { nextCode } };
        },
      },
    });

    const handler = getUserNextAvailableShareCodeCommandHandler(outbound);
    const result = await handler({
      type: "get_user_next_available_share_code",
      userId: "u1",
    });

    expect(result).toEqual({ shareCode: nextCode });
    expect(getCodeArgs).toEqual(["76561198000000001", "STEAM_KEY_ABC", "CSGO-LATEST-XXXXX-XXXXX-XXXXX-XXXXX"]);
    expect(updateCodeArgs).toEqual(["u1", nextCode]);
  });

  test("uses initialKnownShareCode as fallback when latestKnownShareCode is null", async () => {
    const user = makeUserEntity({
      id: "u1",
      steamId: "76561198000000001",
      steamIdKey: "STEAM_KEY_ABC",
      latestKnownShareCode: null,
      initialKnownShareCode: "CSGO-INITIAL-CODE",
    });

    let usedCode: string | null = null;
    const nextCode = "CSGO-NEXT-CODE";

    const outbound = makeOutbound({
      userRepository: {
        getUserById: async () => user,
        updateKnownShareCode: async () => {},
      },
      gameCoordinatorRepository: {
        getNextAvailableShareCode: async (_steamId: string, _steamIdKey: string, lastCode: string) => {
          usedCode = lastCode;
          return { isSuccess: true, data: { nextCode } };
        },
      },
    });

    const handler = getUserNextAvailableShareCodeCommandHandler(outbound);
    const result = await handler({
      type: "get_user_next_available_share_code",
      userId: "u1",
    });

    expect(usedCode).toBe("CSGO-INITIAL-CODE");
    expect(result).toEqual({ shareCode: nextCode });
  });

  test("user not found — throws DomainNotFoundError", async () => {
    const outbound = makeOutbound({
      userRepository: {
        getUserById: async () => null,
      },
    });

    const handler = getUserNextAvailableShareCodeCommandHandler(outbound);
    await expect(
      handler({ type: "get_user_next_available_share_code", userId: "missing-user" }),
    ).rejects.toThrow(DomainNotFoundError);
  });

  test("no sharing data: both latestKnownShareCode and initialKnownShareCode are null — throws DomainConflictError", async () => {
    const user = makeUserEntity({
      id: "u1",
      steamIdKey: "STEAM_KEY_ABC",
      latestKnownShareCode: null,
      initialKnownShareCode: null,
    });

    const outbound = makeOutbound({
      userRepository: {
        getUserById: async () => user,
      },
    });

    const handler = getUserNextAvailableShareCodeCommandHandler(outbound);
    await expect(
      handler({ type: "get_user_next_available_share_code", userId: "u1" }),
    ).rejects.toThrow(DomainConflictError);
  });

  test("has shareCode but no steamIdKey — throws DomainConflictError", async () => {
    const user = makeUserEntity({
      id: "u1",
      steamIdKey: null,
      latestKnownShareCode: "CSGO-LATEST-CODE",
      initialKnownShareCode: "CSGO-INITIAL-CODE",
    });

    const outbound = makeOutbound({
      userRepository: {
        getUserById: async () => user,
      },
    });

    const handler = getUserNextAvailableShareCodeCommandHandler(outbound);
    await expect(
      handler({ type: "get_user_next_available_share_code", userId: "u1" }),
    ).rejects.toThrow(DomainConflictError);
  });

  test("conflict error has correct message", async () => {
    const user = makeUserEntity({
      id: "u1",
      steamIdKey: null,
      latestKnownShareCode: null,
      initialKnownShareCode: null,
    });

    const outbound = makeOutbound({
      userRepository: {
        getUserById: async () => user,
      },
    });

    const handler = getUserNextAvailableShareCodeCommandHandler(outbound);
    await expect(
      handler({ type: "get_user_next_available_share_code", userId: "u1" }),
    ).rejects.toThrow("User has no sharing data configured");
  });
});

// ---------------------------------------------------------------------------
// SeekNextAvailableCodeOfNextUsersCommandHandler
// ---------------------------------------------------------------------------

describe("SeekNextAvailableCodeOfNextUsersCommandHandler", () => {
  const makeUsers = (count: number) =>
    Array.from({ length: count }, (_, i) =>
      makeUserEntity({
        id: `user-${i}`,
        steamId: `7656119800000000${i}`,
        steamIdKey: `key-${i}`,
        latestKnownShareCode: `CSGO-CODE-${i}`,
      }),
    );

  test("full page returned: users.length === step — nextSeekIndex = seekIndex + step", async () => {
    const step = 5;
    const users = makeUsers(step);

    const outbound = makeOutbound({
      userRepository: {
        getUsersWithSharingData: async () => users,
      },
      configuration: {
        shareCodeSeekStep: step,
      },
    });

    const handler = seekNextAvailableCodeOfNextUsersCommandHandler(outbound);
    const result = await handler({
      type: "seek_next_available_code_of_next_users",
      seekIndex: 10,
    });

    expect(result.nextSeekIndex).toBe(15);
    expect(result.users).toHaveLength(step);
  });

  test("partial page returned: users.length < step — nextSeekIndex = 0 (pagination resets)", async () => {
    const step = 10;
    const users = makeUsers(3);

    const outbound = makeOutbound({
      userRepository: {
        getUsersWithSharingData: async () => users,
      },
      configuration: {
        shareCodeSeekStep: step,
      },
    });

    const handler = seekNextAvailableCodeOfNextUsersCommandHandler(outbound);
    const result = await handler({
      type: "seek_next_available_code_of_next_users",
      seekIndex: 20,
    });

    expect(result.nextSeekIndex).toBe(0);
    expect(result.users).toHaveLength(3);
  });

  test("empty page: no users — nextSeekIndex = 0, users = []", async () => {
    const outbound = makeOutbound({
      userRepository: {
        getUsersWithSharingData: async () => [],
      },
      configuration: {
        shareCodeSeekStep: 10,
      },
    });

    const handler = seekNextAvailableCodeOfNextUsersCommandHandler(outbound);
    const result = await handler({
      type: "seek_next_available_code_of_next_users",
      seekIndex: 50,
    });

    expect(result.nextSeekIndex).toBe(0);
    expect(result.users).toEqual([]);
  });

  test("correct field mapping: user fields mapped to { userId, userSteamId, userSteamIdKey, lastKnownShareCode }", async () => {
    const user = makeUserEntity({
      id: "mapped-user-1",
      steamId: "76561198000000042",
      steamIdKey: "mapped-key-abc",
      latestKnownShareCode: "CSGO-MAPPED-CODE",
    });

    const outbound = makeOutbound({
      userRepository: {
        getUsersWithSharingData: async () => [user],
      },
      configuration: {
        shareCodeSeekStep: 1,
      },
    });

    const handler = seekNextAvailableCodeOfNextUsersCommandHandler(outbound);
    const result = await handler({
      type: "seek_next_available_code_of_next_users",
      seekIndex: 0,
    });

    expect(result.users[0]).toEqual({
      userId: "mapped-user-1",
      userSteamId: "76561198000000042",
      userSteamIdKey: "mapped-key-abc",
      lastKnownShareCode: "CSGO-MAPPED-CODE",
    });
  });

  test("getUsersWithSharingData is called with correct offset and limit", async () => {
    let capturedOffset: number | null = null;
    let capturedLimit: number | null = null;
    const step = 7;

    const outbound = makeOutbound({
      userRepository: {
        getUsersWithSharingData: async (offset: number, limit: number) => {
          capturedOffset = offset;
          capturedLimit = limit;
          return [];
        },
      },
      configuration: {
        shareCodeSeekStep: step,
      },
    });

    const handler = seekNextAvailableCodeOfNextUsersCommandHandler(outbound);
    await handler({
      type: "seek_next_available_code_of_next_users",
      seekIndex: 14,
    });

    expect(capturedOffset).toBe(14);
    expect(capturedLimit).toBe(step);
  });
});
