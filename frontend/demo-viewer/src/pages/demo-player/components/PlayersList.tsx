import { Space } from "antd";
import { useDemoViewerViewModel } from "../../../modules/demo-viewer/viewmodel/DemoViewerViewModel.tsx";
import { type HTMLAttributes, useEffect, useState } from "react";
import { PlayerCard } from "../../../components/PlayerCard";
import type { PlayerData } from "../../../components/PlayerCard/PlayerCard.tsx";
import { clsx } from "../../../lib/clsx.ts";
import type { PlayerStateDto } from "@demo-viewer/shared-types";

export const PlayersList = () => {
  const { matchData, subscribe } = useDemoViewerViewModel();

  const [players, setPlayers] = useState(() => {
    return matchData.matchManifest.participants.map(
      (participant) =>
        ({
          health: 100,
          name: participant.name,
          weapon: null,
          utilities: [],
          side: null,
          state: "alive",
          disconnected: true,
          steamId: participant.steamId || crypto.randomUUID(),
        }) as PlayerData,
    );
  });

  useEffect(() => {
    subscribe((event, data) => {
      if (event === "tick") {
        const players = (data as { playerStates: PlayerStateDto[] })
          .playerStates;
        setPlayers((prevState) => {
          const currentIds = new Set(prevState.map((p) => p.steamId));
          const newIds = new Set(players.map((p) => p.steamId64));
          const removedPlayers = currentIds.difference(newIds);

          return players
            .map(
              (p) =>
                ({
                  health: p.hp,
                  name: p.name,
                  weapon: p.currentEquipment.activeWeapon,
                  utilities: p.currentEquipment.grenades,
                  state: p.isAlive ? "alive" : "dead",
                  steamId: p.steamId64,
                  side: p.team as "CT" | "T",
                  disconnected: removedPlayers.has(p.steamId64),
                }) satisfies PlayerData,
            )
            .sort((a, b) => a.name.localeCompare(b.name));
        });
      }
    });
  }, []);

  const ctPlayers = players.filter((p) => p.side === "CT");
  const tPlayers = players.filter((p) => p.side === "T");

  if (!ctPlayers.length || !tPlayers.length) {
    return (
      <PlayersList.Container>
        {players.map((p) => (
          <PlayerCard key={p.steamId} {...p} />
        ))}
      </PlayersList.Container>
    );
  }

  return (
    <PlayersList.Container>
      {ctPlayers.map((p) => (
        <PlayerCard key={p.steamId} {...p} />
      ))}
      <div className="mx-2 h-25 w-px bg-black" />
      {tPlayers.map((p) => (
        <PlayerCard key={p.steamId} {...p} />
      ))}
    </PlayersList.Container>
  );
};

PlayersList.Container = (props: HTMLAttributes<HTMLDivElement>) => {
  return (
    <Space
      {...props}
      orientation="horizontal"
      size={4}
      className={clsx("w-full justify-between mb-4", props.className)}
    />
  );
};
