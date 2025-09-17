export interface Avatar {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  rarity: AvatarRarity;
  category: AvatarCategory;
  isUnlocked: boolean;
  description?: string;
}

export type AvatarRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type AvatarCategory =
  | 'animals'
  | 'fantasy'
  | 'robots'
  | 'nature'
  | 'space';

export interface UserAvatar {
  id: number;
  userId: number;
  avatarId: number;
  isEquipped: boolean;
  purchasedAt: string;
  avatar: Avatar;
}

export interface AvatarPurchaseRequest {
  avatarId: number;
}

export interface AvatarEquipRequest {
  avatarId: number;
}

export interface AvatarShopState {
  avatars: Avatar[];
  userAvatars: UserAvatar[];
  currentAvatar: Avatar | null;
  loading: boolean;
  error: string | null;
}

export interface AvatarShopFilters {
  rarity?: AvatarRarity;
  category?: AvatarCategory;
  showOwned?: boolean;
  showLocked?: boolean;
  searchQuery?: string;
}
