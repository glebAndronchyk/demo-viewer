import type { SteamUserOutboundPort, SteamPlayerSummary } from '@demo-viewer/domain/src/ports/outbound/SteamUserOutboundPort';
import type { ConfigurationInboundPort } from '@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort';
import { MemoryCache, MemoryCacheAccessor } from '@demo-viewer/backend-shared';

interface SteamPlayerSummaryResponse {
  steamid: string;
  avatarmedium: string;
}

interface SteamGetPlayerSummariesResponse {
  response: {
    players: SteamPlayerSummaryResponse[];
  };
}

const STEAM_BATCH_SIZE = 100;

export class SteamUserRepository implements SteamUserOutboundPort {
  private readonly cache: MemoryCacheAccessor<string, string>;

  constructor(
    private readonly configuration: ConfigurationInboundPort,
    memoryCache: MemoryCache,
  ) {
    this.cache = new MemoryCacheAccessor(memoryCache, 'steamAvatars');
  }

  async getPlayerSummaries(steamIds: string[]): Promise<SteamPlayerSummary[]> {
    const validIds = steamIds.filter(Boolean);
    if (validIds.length === 0) return [];

    const uncached: string[] = [];
    const result: SteamPlayerSummary[] = [];

    for (const id of validIds) {
      const cached = this.cache.get(id);
      if (cached !== undefined) {
        result.push({ steamId: id, avatarUrl: cached });
      } else {
        uncached.push(id);
      }
    }

    for (let i = 0; i < uncached.length; i += STEAM_BATCH_SIZE) {
      const batch = uncached.slice(i, i + STEAM_BATCH_SIZE);
      const summaries = await this.fetchBatch(batch);
      for (const s of summaries) {
        this.cache.set(s.steamId, s.avatarUrl);
        result.push(s);
      }
    }

    return result;
  }

  private async fetchBatch(steamIds: string[]): Promise<SteamPlayerSummary[]> {
    const ids = steamIds.join(',');
    const url = `${this.configuration.steamBaseUrl}/ISteamUser/GetPlayerSummaries/v2?key=${this.configuration.steamApiKey}&steamids=${ids}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Steam GetPlayerSummaries error: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as SteamGetPlayerSummariesResponse;
    return (data.response?.players ?? []).map((p) => ({
      steamId: p.steamid,
      avatarUrl: p.avatarmedium,
    }));
  }
}
