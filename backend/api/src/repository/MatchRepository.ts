import { MatchOutboundPort } from "@demo-viewer/domain/src/ports/outbound/MatchOutboundPort";
import { MatchModel } from "@demo-viewer/database";

export class MatchRepository implements MatchOutboundPort {
  async findByShareCode(shareCode: string): Promise<{ id: string } | null> {
    const match = await MatchModel.findOne({ share_code: shareCode }, { _id: 1 }).lean();
    if (!match) return null;
    return { id: String(match._id) };
  }
}
