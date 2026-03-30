# Steam Authentication

## Overview

Authentication uses Steam OpenID 2.0. There is no password — the user proves their identity to Steam, and Steam redirects back to the API with a signed assertion. The API verifies that assertion, finds or creates a user record, and issues a JWT.

## Flow

```
Browser                     API                         Steam
  |                          |                             |
  |-- GET /auth/steam ------>|                             |
  |                          |-- 302 steamcommunity.com -->|
  |                          |                             |
  |<-----------------------------------------302 ----------|
  |                          |                             |
  |-- GET /auth/steam/callback?openid.* --------------->   |
  |                          |                             |
  |                          |-- POST check_authentication |
  |                          |<-- is_valid:true -----------|
  |                          |                             |
  |                          | RegisterOrLoginWithSteam    |
  |                          | LinkMatchesToUser (async)   |
  |                          |                             |
  |<-- 302 /auth/callback?token=<jwt> ----------------     |
```

## Step-by-step

### 1. Initiate login — `GET /auth/steam`

The API builds an OpenID 2.0 redirect URL targeting `steamcommunity.com/openid/login` and returns a 302. Key parameters:

| Parameter | Value |
|---|---|
| `openid.mode` | `checkid_setup` |
| `openid.return_to` | `{API_BASE_URL}/auth/steam/callback` |
| `openid.realm` | Origin of the API |
| `openid.identity` | `identifier_select` (lets Steam choose the claimed ID) |

Implementation: `backend/api/src/lib/steamOpenId.ts` → `buildSteamLoginUrl`

### 2. Steam callback — `GET /auth/steam/callback`

Steam redirects back with a set of `openid.*` query parameters, including `openid.claimed_id` which contains the user's Steam ID in the form:

```
https://steamcommunity.com/openid/id/76561198012345678
```

The API verifies these parameters by POSTing them back to Steam with `openid.mode=check_authentication`. Steam responds with `is_valid:true` if the assertion is genuine. The Steam ID is extracted from the `claimed_id` URL with a regex.

Implementation: `backend/api/src/lib/steamOpenId.ts` → `verifySteamOpenId`

### 3. Register or login

After verification the `register_or_login_with_steam` command runs:

1. Look up `users` collection by `steam_id`.
2. If not found, create a new user document.
3. Sign a JWT (HS256, 30-day expiry) containing `sub` (user ID) and `steamId`.

Implementation: `backend/domain/src/handlers/RegisterOrLoginWithSteamHandler.ts`

### 4. Link existing matches (fire-and-forget)

Matches parsed before the user logged in already have `participants.steam_id` set but no `participants.user_id`. The `link_matches_to_user` command runs a MongoDB `updateMany` with an `arrayFilters` to backfill `user_id` on every matching participant:

```js
MatchModel.updateMany(
  { "participants.steam_id": steamId },
  { $set: { "participants.$[elem].user_id": userId } },
  { arrayFilters: [{ "elem.steam_id": steamId }] }
)
```

This runs asynchronously — the redirect is not blocked by it. Errors are logged to `console.error`.

Implementation: `backend/domain/src/handlers/LinkMatchesToUserHandler.ts`

### 5. Frontend redirect

The API redirects to `{FRONTEND_URL}/auth/callback?token=<jwt>`. The frontend is responsible for storing the token and including it in subsequent requests.

## Using the JWT

Protected routes require an `Authorization` header:

```
Authorization: Bearer <token>
```

The `jwtGuard` plugin (`backend/api/src/lib/jwtGuard.ts`) verifies the token using `jose` and exposes `currentUser` to the route handler:

```typescript
{ userId: string; steamId: string }
```

Example: `GET /auth/me` returns the current user's `userId` and `steamId`.

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `JWT_SECRET` | HS256 signing secret (min 256-bit) | — |
| `API_BASE_URL` | Public URL of this API | `http://localhost:3000` |
| `FRONTEND_URL` | Frontend origin for post-login redirect | `http://localhost:5173` |

## Database

No migrations needed. The existing schema already provides:

- `users.steam_id` — indexed, used for lookup and creation
- `matches.participants[].steam_id` — used to find matches to backfill
- `matches.participants[].user_id` — populated by `link_matches_to_user`
