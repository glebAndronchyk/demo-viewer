import { Elysia, t } from "elysia";
import { CommandBusService } from "../adapters/CommandBusService";
import {
  GetMatchManifestCommand,
  GetMatchManifestCommandResult,
} from "@demo-viewer/domain/src/commands/GetMatchManifestCommand";
import { BaseResponse } from "@demo-viewer/domain/src/types/BaseResponse";
import {
  DemoChunkEntity,
  DemoEvent,
} from "@demo-viewer/domain/src/entities/DemoChunkEntity";
import { GetTickSeekReadableStreamCommand } from "@demo-viewer/domain/src/commands/GetTickSeekReadableStreamCommand";
import { MemoryCache, MemoryCacheAccessor } from "@demo-viewer/backend-shared";
import {
  GetPaginatedMatchesCommand,
  GetPaginatedMatchesCommandResult,
} from "@demo-viewer/domain/src/commands/GetPaginatedMatchesCommand.ts";

export class StreamingController {
  constructor(
    app: Elysia,
    commandBus: CommandBusService,
    memoryCache: MemoryCache,
  ) {
    const matchListCacheAccessor = new MemoryCacheAccessor<
      string,
      GetPaginatedMatchesCommandResult
    >(memoryCache, "matchList");

    app.use(
      new Elysia({ prefix: "/streaming/matches", tags: ["streaming"] }).get(
        "/list",
        async ({
          query: { page, steamIds: steamIdsParam },
        }): Promise<
          BaseResponse<{
            pagination: GetPaginatedMatchesCommandResult;
          }>
        > => {
          const steamIds = steamIdsParam ? steamIdsParam.split(",").filter(Boolean) : undefined;
          const cacheKey = `${page}:${steamIds?.join(",") ?? ""}`;

          if (matchListCacheAccessor.has(cacheKey)) {
            return {
              data: { pagination: matchListCacheAccessor.get(cacheKey)! },
              isSuccess: true,
            };
          }

          const paginatedResult =
            await commandBus.dispatch<GetPaginatedMatchesCommand>({
              type: "get_paginated_matchers",
              page,
              steamIds,
            });

          matchListCacheAccessor.set(cacheKey, paginatedResult);

          return {
            data: { pagination: paginatedResult },
            isSuccess: true,
          };
        },
        {
          query: t.Object({
            page: t.Number(),
            steamIds: t.Optional(t.String()),
          }),
        },
      ),
    );
    app.use(
      new Elysia({ prefix: "/streaming/player", tags: ["streaming"] })
        .get(
          "/manifest/:matchId",
          async ({
            params,
          }): Promise<BaseResponse<GetMatchManifestCommandResult>> => {
            const manifestResult =
              await commandBus.dispatch<GetMatchManifestCommand>({
                type: "get_match_manifest",
                matchId: params.matchId,
              });

            return {
              data: manifestResult,
              isSuccess: true,
            } satisfies BaseResponse<GetMatchManifestCommandResult>;
          },
          {
            params: t.Object({
              matchId: t.String(),
            }),
          },
        )
        .get(
          "/seek/:matchId",
          async ({
            params: { matchId },
            query: { startGameTick, endGameTick, step, includeTransientEvents },
          }): Promise<
            BaseResponse<{
              frames: DemoChunkEntity["frames"];
              transientEvents?: DemoEvent[];
            }>
          > => {
            const result =
              await commandBus.dispatch<GetTickSeekReadableStreamCommand>({
                type: "get_tick_seek_readable_stream",
                endGameTick: Number(endGameTick),
                step: Number(step),
                startGameTick: Number(startGameTick),
                matchId,
                includeTransientEvents: includeTransientEvents === "true",
              });

            return {
              data: {
                frames: result.frames,
                transientEvents: result.transientEvents,
              },
              isSuccess: true,
            };
          },
          {
            params: t.Object({
              matchId: t.String(),
            }),
            query: t.Object({
              startGameTick: t.String(),
              endGameTick: t.String(),
              step: t.Union([
                t.Literal("16"),
                t.Literal("32"),
                t.Literal("64"),
                t.Literal("128"),
              ]),
              includeTransientEvents: t.Optional(t.String()),
            }),
          },
        ),
    );
  }
}
