import { Elysia, t } from "elysia";
import { CommandBusService } from "../adapters/CommandBusService";

export class AnalyticsController {
  constructor(app: Elysia, commandBus: CommandBusService) {
    app.use(
      new Elysia({ prefix: "/analytics", tags: ["analytics"] })
        .get(
          "/match/generic",
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
          "/total/generic",
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
