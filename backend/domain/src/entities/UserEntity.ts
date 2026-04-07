export interface UserEntity {
  id: string;
  steamId: string;
  steamIdKey: string | null;
  latestKnownShareCode: string | null;
  initialKnownShareCode: string | null;
  shareCodeVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
