import { Elysia, t } from "elysia";
import { CommandBusService } from "../adapters/CommandBusService";
import {
  GetPlayerWeaponAnalyticsCommand,
  GetPlayerWeaponAnalyticsCommandResult,
} from "@demo-viewer/domain/src/commands/GetPlayerWeaponAnalyticsCommand.ts";
import {
  GetPlayerEconomyAnalyticsCommand,
  GetPlayerEconomyAnalyticsCommandResult,
} from "@demo-viewer/domain/src/commands/GetPlayerEconomyAnalyticsCommand.ts";
import { BaseResponse } from "@demo-viewer/domain/src/types/BaseResponse.ts";
import {
  GetPlayerPerformanceAnalyticsCommand,
  GetPlayerPerformanceAnalyticsCommandResult,
} from "@demo-viewer/domain/src/commands/GetPlayerPerformanceAnalyticsCommand.ts";

export class StatisticsController {
  constructor(app: Elysia, commandBus: CommandBusService) {
    app.use(
      new Elysia({ prefix: "/statistics", tags: ["statistics"] })
        .get(
          "/match/player-stats",
          async ({ query }) => {
            const result = await commandBus.dispatch({
              type: "get_match_player_stats",
              matchId: query.matchId,
              steamId: query.steamId,
            });
            return { data: result.stats, error: null, isSuccess: true };
          },
          {
            query: t.Object({
              matchId: t.String(),
              steamId: t.String(),
            }),
          },
        )
        .get(
          "/total/weapons",
          async ({ query: { steamId, startDate } }) => {
            return {
              data: await commandBus.dispatch<GetPlayerWeaponAnalyticsCommand>({
                type: "get_player_weapon_analytics",
                steamId,
                startDate,
              }),
              isSuccess: true,
            } satisfies BaseResponse<GetPlayerWeaponAnalyticsCommandResult>;
          },
          {
            query: t.Object({
              steamId: t.String(),
              startDate: t.Date(),
            }),
          },
        )
        .get(
          "/total/economy",
          async ({ query: { steamId, startDate } }) => {
            return {
              data: await commandBus.dispatch<GetPlayerEconomyAnalyticsCommand>(
                {
                  type: "get_player_economy_analytics",
                  steamId,
                  startDate,
                },
              ),
              isSuccess: true,
            } satisfies BaseResponse<GetPlayerEconomyAnalyticsCommandResult>;
          },
          {
            query: t.Object({
              steamId: t.String(),
              startDate: t.Date(),
            }),
          },
        )
        .get(
          "/total/performance",
          async ({ query: { steamId, startDate } }) => {
            return {
              data: await commandBus.dispatch<GetPlayerPerformanceAnalyticsCommand>(
                {
                  type: "get_player_performance_analytics",
                  steamId,
                  startDate,
                },
              ),
              isSuccess: true,
            } satisfies BaseResponse<GetPlayerPerformanceAnalyticsCommandResult>;
          },
          {
            query: t.Object({
              steamId: t.String(),
              startDate: t.Date(),
            }),
          },
        )
        .get(
          "/total/player-stats",
          async ({ query }) => {
            const result = await commandBus.dispatch({
              type: "get_total_player_stats",
              steamId: query.steamId,
            });
            return { data: result.stats, error: null, isSuccess: true };
          },
          {
            query: t.Object({
              steamId: t.String(),
            }),
          },
        ),
    );
  }
}
