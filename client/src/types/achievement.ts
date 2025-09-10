export interface Achievement {
  id: number;
  key: string;
  title: string;
  description: string;
  icon?: string;
  category: 'knowledge' | 'exam' | 'speed' | 'persistence' | 'social' | 'score' | 'special';
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned?: boolean;
  earned_at?: string;
}

export interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: number;
  earned_at: string;
  game_session_id?: number;
  metadata?: any;
  achievement: Achievement;
  game_session?: {
    id: number;
    room_name: string;
  };
}

export interface AchievementStats {
  totalAchievements: number;
  earnedAchievements: number;
  totalBonusPoints: number;
  completionPercentage: number;
}

export interface AchievementNotification {
  userId: number;
  achievements: Achievement[];
}

export const ACHIEVEMENT_CATEGORIES = {
  knowledge: 'Знания',
  exam: 'Экзамены',
  speed: 'Скорость',
  persistence: 'Упорство',
  social: 'Социальные',
  score: 'Очки',
  special: 'Особые'
} as const;

export const ACHIEVEMENT_RARITIES = {
  common: 'Обычное',
  rare: 'Редкое',
  epic: 'Эпическое',
  legendary: 'Легендарное'
} as const;

export const RARITY_COLORS = {
  common: '#6b7280', // gray-500
  rare: '#3b82f6', // blue-500
  epic: '#8b5cf6', // violet-500
  legendary: '#f59e0b' // amber-500
} as const;
