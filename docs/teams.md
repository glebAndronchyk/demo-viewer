# Teams Management

## User stories

### Team Member Stories

~~- As a team member, I want to be able to check compatibility between other players on different maps;~~
~~- As a team member, I want to be able to check the problematic zones of a selected map;~~

### Team Owner Stories

> The team owner functionality extends the team member functionality described above:

- As a team owner, I want to be able to invite members to my team (group);
- As a team owner, I want to be able to change the visibility/openness of my group;
- As a team owner, I want to be able to edit my team's information;
- As a team owner, I want to be able to remove users from the team;
~~- As a team owner, I want to be able to upload demo files that will be taken into account in the calculation of team statistics;~~

### Security

- Team admin endpoint should check user auth and identity, before performing any actions related to changing team data;
- Always verify that person is the part of team before performing any data querying.

---

## API

### Routes

| Method   | Path                                    | Auth              | Description                          |
|----------|-----------------------------------------|-------------------|--------------------------------------|
| `POST`   | `/team`                                 | JWT (any user)    | Create a new team; owner auto-enrolled as member |
| `GET`    | `/team/member/:groupId`                 | teamMemberPlugin  | Get team info                        |
| `GET`    | `/team/member/:groupId/users`           | teamMemberPlugin  | List all team members                |
| `POST`   | `/team/owner/:groupId/invite`           | teamOwnerPlugin   | Invite a user by `steamId`           |
| `DELETE` | `/team/owner/:groupId/users/:userId`    | teamOwnerPlugin   | Remove a member (owner cannot remove themselves) |
| `PATCH`  | `/team/owner/:groupId`                  | teamOwnerPlugin   | Update team `name` and/or `isOpen`   |

### Guards

- **`teamMemberPlugin`** — verifies JWT + confirms `sub` is a member of `:groupId`
- **`teamOwnerPlugin`** — verifies JWT + confirms `sub` is the owner of `:groupId`

Both are scoped Elysia plugins that short-circuit with `401`/`403` before the route handler runs. Handlers additionally re-verify ownership via `requesterId` (defense-in-depth).

---

## Implementation

### Database

- **Collections**: `groups`, `group_members` (pre-existing)
- **Migration** `20260414120000_group_is_open`: added `is_open: boolean` (default `false`) to `groups`

### Domain layer (`backend/domain/`)

**Entities**
- `GroupEntity` — `id`, `name`, `ownerId`, `isOpen`, `createdAt`, `updatedAt`
- `GroupMemberEntity` — `id`, `userId`, `groupId`, `createdAt`, `updatedAt`

**Port** — `TeamOutboundPort` defines:
`createTeam`, `getTeamById`, `getTeamByOwnerId`, `addMember`, `removeMember`, `getMembers`, `isMember`, `updateTeam`

**Commands & handlers**

| Command type            | Handler file                          |
|-------------------------|---------------------------------------|
| `create_team`           | `CreateTeamHandler.ts`                |
| `add_user_to_team`      | `AddUserToTeamCommandHandler.ts`      |
| `remove_user_from_team` | `RemoveUserFromTeamHandler.ts`        |
| `update_team`           | `UpdateTeamHandler.ts`                |
| `get_team`              | `GetTeamHandler.ts`                   |
| `get_team_members`      | `GetTeamMembersHandler.ts`            |

**Errors** — `DomainForbiddenError` added to `DomainErrors.ts`; mapped to HTTP 403 in `App.ts`.

### API layer (`backend/api/`)

- **`TeamRepository`** — implements `TeamOutboundPort` using `GroupModel` / `GroupMemberModel` directly
- **`group.mapper.ts`** — `toGroupEntity`, `toGroupMemberEntity`
- **Plugins** — `teamMemberPlugin.ts`, `teamOwnerPlugin.ts`
- **Controller** — `TeamController.ts`

### Other changes

- `UserOutboundPort` + `UserRepository`: added `getUserBySteamId(steamId)` (used by invite handler to resolve Steam ID → internal user ID)
- `AnalyticsController`: removed a leftover placeholder stub that used the old `CreateTeamCommand` shape
