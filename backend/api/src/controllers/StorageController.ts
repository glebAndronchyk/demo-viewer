import { Elysia, t } from "elysia";
import { CommandBusService } from "../adapters/CommandBusService";
import type { GetMapRadarAssetsCommand } from "@demo-viewer/domain/src/commands/GetMapRadarAssetsCommand";
import type { StreamAssetResponse } from "@demo-viewer/domain/src/ports/outbound/StorageOutboundPort";

export class StorageController {
  constructor(app: Elysia, commandBus: CommandBusService) {
    app.use(
      new Elysia({ prefix: "/storage/static", tags: ["storage"] })
        .get(
          "/map/:mapId/:layer",
          async ({ params, redirect }) => {
            const { asset } =
              await commandBus.dispatch<GetMapRadarAssetsCommand>({
                type: "get_map_radar_assets",
                mapId: params.mapId,
                layer: params.layer,
              });

            if (typeof asset === "string") {
              redirect(asset, 302);
              return;
            }

            return new Response((asset as StreamAssetResponse).stream(), {
              headers: {
                "Content-Type": (asset as StreamAssetResponse).preflight
                  .contentType,
              },
            });
          },
          {
            params: t.Object({
              mapId: t.String(),
              layer: t.String(),
            }),
          },
        )
        .get("/map/:mapId/manifest", async ({ params, redirect }) => {
          // todo load manifest

          return "manifest.json";
        }),
    );
  }
}
