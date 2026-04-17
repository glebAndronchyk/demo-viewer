import { AnalyticsCalculator } from "./types/AnalyticsCalculator.ts";
import {
  ItemDropEvent,
  ItemPickupEvent,
  ItemRefundEvent,
} from "../../entities/events";
import type { Frame } from "../../entities/DemoChunkEntity.ts";
import { Weapon } from "../../entities/WeaponType.ts";
import type { PlayerEconomyEntity } from "../../entities/PlayerEconomyEntity.ts";

// todo: include "dropped by teammates" check

/**
 * Very common economy calculator. It analyzes expenses only for understanding round playstyle (eco/full/force).
 * Refunded items are excluded from expensesAmount. Dropped and refunded items are excluded from totalEquipmentValue.
 */
export class MatchPlayerEconomyCalculator extends AnalyticsCalculator<
  Omit<PlayerEconomyEntity, "statsId">
> {
  private async sharedQuery() {
    let startFrames = this.dbCache.get("startFrames") as Frame[];

    if (!startFrames) {
      startFrames = await this.matchOutbound.getFirstGameTickOfEveryRound(
        this.matchId,
      );
      this.dbCache.set("startFrames", startFrames);
    }

    const events = await this.matchOutbound.getAggregatedEvents(
      { matchId: this.matchId },
      [
        ItemPickupEvent.query()
          .forPlayer(this.playerSteamId)
          .asBought()
          .build(),
        ItemDropEvent.query().asPlayer(this.playerSteamId).build(),
        ItemRefundEvent.query().asPlayer(this.playerSteamId).build(),
      ],
      {
        get: () =>
          this.dbCache.get("sharedQuery") as [
            ItemPickupEvent[],
            ItemDropEvent[],
            ItemRefundEvent[],
          ],
        set: (v) => this.dbCache.set("sharedQuery", v),
      },
    );

    const inRound = (
      e: { gameTick: number },
      f: Frame,
      nextFrame: Frame | undefined,
    ) =>
      e.gameTick >= f.gameTick &&
      (!nextFrame || e.gameTick < nextFrame.gameTick);

    return {
      startFrames,
      events,
      getEventsPerRound: (f: Frame) => {
        const [boughtEvents] = events;
        const frameIndex = startFrames.indexOf(f);
        const nextFrame = startFrames[frameIndex + 1];

        return boughtEvents.filter((e) => inRound(e, f, nextFrame));
      },
      getDropEventsPerRound: (f: Frame) => {
        const [, dropEvents] = events;
        const frameIndex = startFrames.indexOf(f);
        const nextFrame = startFrames[frameIndex + 1];

        return dropEvents.filter((e) => inRound(e, f, nextFrame));
      },
      getRefundEventsPerRound: (f: Frame) => {
        const [, , refundEvents] = events;
        const frameIndex = startFrames.indexOf(f);
        const nextFrame = startFrames[frameIndex + 1];

        return refundEvents.filter((e) => inRound(e, f, nextFrame));
      },
    };
  }

  override async calculate(): Promise<Omit<PlayerEconomyEntity, "statsId">> {
    await this.sharedQuery(); // pre-cache

    const [ecoFrames, forceFrames, fullBuyFrames, ecoWonFrames] =
      await Promise.all([
        this.getEcoBuyRoundsFrames().catch(() => []),
        this.getForceRoundsFrames().catch(() => []),
        this.getFullBuyRoundsFrames().catch(() => []),
        this.getEcoWonRoundsFrames().catch(() => []),
      ]);

    return {
      _analyticsType: "economy",
      roundsEco: ecoFrames.length,
      roundsForceBuy: forceFrames.length,
      roundsFullBuy: fullBuyFrames.length,
      roundsEcoWon: ecoWonFrames.length,
      dateRecorded: new Date(),
    };
  }

  async getEcoWonRoundsFrames() {
    const ecoFrames = await this.getEcoBuyRoundsFrames();

    const roundInfos = await Promise.all(
      ecoFrames.map((f) =>
        this.matchOutbound.getRoundInfoByFrame(this.matchId, f),
      ),
    );

    return ecoFrames.filter((f, i) => {
      const roundInfo = roundInfos[i];
      if (!roundInfo) return false;

      const playerState = f.playerStates.find(
        (p) => p.steamId64 === this.playerSteamId,
      );
      if (!playerState) return false;

      return roundInfo.winner === playerState.team;
    });
  }

  async getForceRoundsFrames() {
    const {
      startFrames,
      getEventsPerRound,
      getDropEventsPerRound,
      getRefundEventsPerRound,
    } = await this.sharedQuery();

    return startFrames.filter((f) => {
      return this.isRoundForceBuy(
        f,
        getEventsPerRound(f),
        getDropEventsPerRound(f),
        getRefundEventsPerRound(f),
      );
    });
  }

  async getEcoBuyRoundsFrames() {
    const {
      startFrames,
      getEventsPerRound,
      getDropEventsPerRound,
      getRefundEventsPerRound,
    } = await this.sharedQuery();

    return startFrames.filter((f) => {
      return this.isRoundEcoBuy(
        f,
        getEventsPerRound(f),
        getDropEventsPerRound(f),
        getRefundEventsPerRound(f),
      );
    });
  }

  async getFullBuyRoundsFrames() {
    const {
      startFrames,
      getEventsPerRound,
      getDropEventsPerRound,
      getRefundEventsPerRound,
    } = await this.sharedQuery();

    return startFrames.filter((f) => {
      return this.isRoundFullBuy(
        f,
        getEventsPerRound(f),
        getDropEventsPerRound(f),
        getRefundEventsPerRound(f),
      );
    });
  }

  isRoundEcoBuy(
    roundStartFrame: Frame,
    roundBuyEvents: ItemPickupEvent[],
    roundDropEvents: ItemDropEvent[],
    roundRefundEvents: ItemRefundEvent[],
  ) {
    const playerInfo = this.getPerPlayerInfo(
      roundStartFrame,
      roundBuyEvents,
      roundDropEvents,
      roundRefundEvents,
    );
    if (!playerInfo) return false;
    return playerInfo.totalEquipmentValue < 750;
  }

  isRoundFullBuy(
    roundStartFrame: Frame,
    roundBuyEvents: ItemPickupEvent[],
    roundDropEvents: ItemDropEvent[],
    roundRefundEvents: ItemRefundEvent[],
  ) {
    const playerInfo = this.getPerPlayerInfo(
      roundStartFrame,
      roundBuyEvents,
      roundDropEvents,
      roundRefundEvents,
    );
    if (!playerInfo) return false;
    return playerInfo.totalEquipmentValue > 3500;
  }

  isRoundForceBuy(
    roundStartFrame: Frame,
    roundBuyEvents: ItemPickupEvent[],
    roundDropEvents: ItemDropEvent[],
    roundRefundEvents: ItemRefundEvent[],
  ) {
    const playerInfo = this.getPerPlayerInfo(
      roundStartFrame,
      roundBuyEvents,
      roundDropEvents,
      roundRefundEvents,
    );
    if (!playerInfo) return false;

    const isFullBuy = this.isRoundFullBuy(
      roundStartFrame,
      roundBuyEvents,
      roundDropEvents,
      roundRefundEvents,
    );
    const isEcoBuy = this.isRoundEcoBuy(
      roundStartFrame,
      roundBuyEvents,
      roundDropEvents,
      roundRefundEvents,
    );

    return (
      !isFullBuy &&
      !isEcoBuy &&
      playerInfo.expensesAmount / playerInfo.startMoney >= 0.75
    );
  }

  private getPerPlayerInfo(
    roundStartFrame: Frame,
    roundBuyEvents: ItemPickupEvent[],
    roundDropEvents: ItemDropEvent[],
    roundRefundEvents: ItemRefundEvent[],
  ) {
    const player = roundStartFrame.playerStates.find(
      (p) => p.steamId64 === this.playerSteamId,
    );

    if (!player) return null;

    const startMoney = player.money;
    const startEquipmentPrice = Weapon.getTotalPlayerEquipmentPrices(player);

    const droppedEntityIds = new Set(
      roundDropEvents
        .filter((e) => e.weaponEntityId !== null)
        .map((e) => e.weaponEntityId),
    );
    const refundedEntityIds = new Set(
      roundRefundEvents
        .filter((e) => e.weaponEntityId !== null)
        .map((e) => e.weaponEntityId),
    );

    // Refunded items are money-back: exclude from expenses
    const expensesAmount = roundBuyEvents
      .filter(
        (e) =>
          e.weaponEntityId === null || !refundedEntityIds.has(e.weaponEntityId),
      )
      .reduce((acc, curr) => acc + Weapon.getItemPickupEventPrice(curr), 0);

    // Dropped and refunded items are no longer in inventory: exclude from equipment value
    const effectiveBuyEvents = roundBuyEvents.filter(
      (e) =>
        e.weaponEntityId === null ||
        (!droppedEntityIds.has(e.weaponEntityId) &&
          !refundedEntityIds.has(e.weaponEntityId)),
    );
    const totalEquipmentValue =
      startEquipmentPrice +
      effectiveBuyEvents.reduce(
        (acc, curr) => acc + Weapon.getItemPickupEventPrice(curr),
        0,
      );

    return {
      player,
      startMoney,
      startEquipmentPrice,
      expensesAmount,
      totalEquipmentValue,
    };
  }
}
