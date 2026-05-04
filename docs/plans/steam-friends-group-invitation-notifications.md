# Plan: Steam Friends Group Invitation Notification System

## Context

Users need a way to invite their Steam friends into groups (teams). Currently `AddUserToTeamCommand` directly adds users — there's no invitation flow, no pending state, and no notification mechanism. The goal is to build an abstract notification queue backed by a cron job (matching the existing parsing/analytics cron pattern), and use it to drive group invitations where the recipient list comes from the requester's Steam friends list.

## Architecture Overview

### New Concepts
1. **NotificationEntity** — a pending notification record (type, payload, recipient, status)
2. **NotificationOutboundPort** — domain port for persisting/querying notifications
3. **NotificationRepository** — API-layer adapter implementing the port
4. **DB schema + migration** — `notifications` MongoDB collection
5. **ProcessPendingNotificationsCommand + Handler** — processes a batch of undelivered notifications (cron-driven)
6. **SendGroupInvitationCommand + Handler** — creates an invitation notification after verifying Steam friendship
7. **GetSteamFriendsCommand + Handler** — fetches the caller's Steam friends list
8. **ProcessPendingNotificationsCron** — periodic cron (every ~5s) that dispatches `process_pending_notifications`
9. **SteamFriendsRepository** — API-layer adapter implementing `SteamFriendsOutboundPort` using the Steam Web API

---

## Data Model

### NotificationEntity (`backend/domain/src/entities/NotificationEntity.ts`)
```ts
interface NotificationEntity {
  id: string;
  type: string;           // e.g. "group_invitation"
  recipientUserId: string;
  payload: Record<string, unknown>;  // type-specific data
  status: "pending" | "delivered" | "dismissed";
  createdAt: Date;
  updatedAt: Date;
}
```

### DB Schema (`backend/database/src/schemas/notification.schema.ts`)
- Collection: `notifications`
- Indexes: `recipient_user_id`, `status`

---

## New Files

| File | Purpose |
|------|---------|
| `backend/database/src/schemas/notification.schema.ts` | Mongoose schema |
| `backend/database/src/models/NotificationModel.ts` | Mongoose model |
| `backend/domain/src/entities/NotificationEntity.ts` | Domain entity |
| `backend/domain/src/ports/outbound/NotificationOutboundPort.ts` | Port interface |
| `backend/domain/src/ports/outbound/SteamFriendsOutboundPort.ts` | Port for Steam friends |
| `backend/domain/src/commands/SendGroupInvitationCommand.ts` | Invite command |
| `backend/domain/src/commands/ProcessPendingNotificationsCommand.ts` | Batch-process command |
| `backend/domain/src/commands/GetSteamFriendsCommand.ts` | Fetch friends command |
| `backend/domain/src/handlers/SendGroupInvitationCommandHandler.ts` | Invite handler |
| `backend/domain/src/handlers/ProcessPendingNotificationsCommandHandler.ts` | Process handler |
| `backend/domain/src/handlers/GetSteamFriendsCommandHandler.ts` | Friends handler |
| `backend/api/src/repository/NotificationRepository.ts` | Notification DB adapter |
| `backend/api/src/repository/SteamFriendsRepository.ts` | Steam friends adapter |
| `backend/api/src/cron/ProcessPendingNotificationsCron.ts` | Cron job |
| `backend/database/migrations/YYYYMMDD_add_notifications.cjs` | DB migration |

---

## Modified Files

| File | Change |
|------|--------|
| `backend/database/src/schemas/index.ts` | Export notification schema |
| `backend/database/src/models/index.ts` | Export notification model |
| `backend/database/src/index.ts` | Re-export new model/schema |
| `backend/domain/src/types/DomainOutbound.ts` | Add `notificationRepository`, `steamFriendsRepository` |
| `backend/domain/src/handlers/index.ts` | Export 3 new handler registrations |
| `backend/api/src/cron/index.ts` | Export `ProcessPendingNotificationsCron` |
| `backend/api/src/index.ts` | Wire new repo + cron into DI |

---

## Key Command Flows

### SendGroupInvitation
```
Controller → SendGroupInvitationCommand {
  requesterId, requesterSteamId, targetSteamId, groupId
}
Handler:
  1. Verify group exists and requester is owner
  2. steamFriendsRepository.getFriendsOf(requesterSteamId) → string[]
  3. Assert targetSteamId is in friends list → DomainForbiddenError if not
  4. Verify targetSteamId user exists in DB
  5. Check: no pending invitation already exists for this user+group
  6. notificationRepository.createNotification({
       type: "group_invitation",
       recipientUserId: targetUser.id,
       payload: { groupId, invitedBy: requesterId },
       status: "pending"
     })
```

### ProcessPendingNotifications (cron-driven)
```
Cron → ProcessPendingNotificationsCommand { batchSize: 20 }
Handler:
  1. notificationRepository.getPendingNotifications(batchSize)
  2. For each notification, dispatch type-specific action:
     - "group_invitation": call teamRepository.addMember (auto-accept for now)
       and mark notification "delivered"
  3. Return { processed: number }
```

### GetSteamFriends (for frontend to show invite suggestions)
```
Controller → GetSteamFriendsCommand { requesterSteamId }
Handler:
  1. steamFriendsRepository.getFriendsOf(requesterSteamId)
  2. Return { steamIds: string[] }
```

---

## SteamFriendsOutboundPort

```ts
interface SteamFriendsOutboundPort {
  getFriendsOf(steamId: string): Promise<string[]>;
}
```

**Implementation** (`SteamFriendsRepository`): calls the Steam Web API `ISteamUser/GetFriendList/v1` with the user's steamId64 using `configuration.steamApiKey`. Returns only relationships with `relationship: "friend"`.

---

## NotificationOutboundPort

```ts
interface NotificationOutboundPort {
  createNotification(data: Omit<NotificationEntity, "id" | "createdAt" | "updatedAt">): Promise<NotificationEntity>;
  getPendingNotifications(limit: number): Promise<NotificationEntity[]>;
  markAsDelivered(id: string): Promise<void>;
  markAsDismissed(id: string): Promise<void>;
  getPendingForUser(userId: string): Promise<NotificationEntity[]>;
  hasPendingInvitation(userId: string, groupId: string): Promise<boolean>;
}
```

---

## Cron Pattern (mirrors CollectMatchesFromUserCron)

```ts
export class ProcessPendingNotificationsCron {
  constructor(app: Elysia, commandBus: CommandBusService, configuration: ConfigurationInboundPort) {
    app
      .state({ isNotificationsRunning: false })
      .use(cron({
        name: "processNotificationsCron",
        pattern: "*/5 * * * * *",
        async run() {
          const store = app.store as { isNotificationsRunning: boolean };
          if (store.isNotificationsRunning) return;
          store.isNotificationsRunning = true;
          try {
            await commandBus.dispatch({ type: "process_pending_notifications", batchSize: 20 });
          } finally {
            store.isNotificationsRunning = false;
          }
        }
      }));
  }
}
```

---

## Migration

```bash
bun run migrate:create add_notifications
# Edit generated file: create `notifications` collection with indexes on `recipient_user_id` and `status`
bun run migrate:up
```

---

## Verification

1. `bun --filter @demo-viewer/domain type-check` — no type errors
2. `bun --filter @demo-viewer/api type-check` — no type errors
3. Start API: `bun run dev:api` — cron logs appear every 5s
4. Call `POST /team/:id/invite` with a steamId that is a Steam friend of the requester → notification created in DB
5. Within 5s, cron fires → member added to group, notification marked delivered
6. Call with non-friend steamId → `DomainForbiddenError` (403)
7. Call duplicate invite → error (pending already exists)