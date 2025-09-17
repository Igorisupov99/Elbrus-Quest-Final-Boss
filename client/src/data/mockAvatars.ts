import type { Avatar } from '../types/avatar';

export const mockAvatars: Avatar[] = [
  // Герои
  {
    id: 1,
    name: 'Воин-спартанец',
    imageUrl: '/warrior_resized_321x198.png',
    price: 50,
    rarity: 'common',
    category: 'fantasy',
    isUnlocked: false,
    description: 'Могучий воин с мечом и щитом, готовый к битве',
  },
  {
    id: 2,
    name: 'Маг-волшебник',
    imageUrl: '/mage_resized_321x198.png',
    price: 150,
    rarity: 'rare',
    category: 'fantasy',
    isUnlocked: false,
    description: 'Мудрый колдун, владеющий древней магией',
  },
  {
    id: 3,
    name: 'Тёмный странник',
    imageUrl: '/ChatGPT Image Sep 17, 2025, 08_01_02 PM.png',
    price: 300,
    rarity: 'epic',
    category: 'fantasy',
    isUnlocked: false,
    description: 'Загадочная фигура в капюшоне, хранящая тайны',
  },

  // Фэнтези
  {
    id: 4,
    name: 'Маг-элементалист',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    price: 75,
    rarity: 'common',
    category: 'fantasy',
    isUnlocked: false,
    description: 'Мастер стихий с древними знаниями',
  },
  {
    id: 5,
    name: 'Эльф-стрелок',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    price: 200,
    rarity: 'rare',
    category: 'fantasy',
    isUnlocked: false,
    description: 'Изящный эльф с меткой стрелой',
  },
  {
    id: 6,
    name: 'Дракон-хранитель',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    price: 500,
    rarity: 'legendary',
    category: 'fantasy',
    isUnlocked: false,
    description: 'Древний дракон, защищающий сокровища',
  },

  // Роботы
  {
    id: 7,
    name: 'Кибер-помощник',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    price: 60,
    rarity: 'common',
    category: 'robots',
    isUnlocked: false,
    description: 'Дружелюбный робот-компаньон',
  },
  {
    id: 8,
    name: 'Боевой дроид',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    price: 180,
    rarity: 'rare',
    category: 'robots',
    isUnlocked: false,
    description: 'Высокотехнологичный воин будущего',
  },
  {
    id: 9,
    name: 'ИИ-повелитель',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    price: 400,
    rarity: 'epic',
    category: 'robots',
    isUnlocked: false,
    description: 'Сверхразумный искусственный интеллект',
  },

  // Природа
  {
    id: 10,
    name: 'Древесный дух',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    price: 80,
    rarity: 'common',
    category: 'nature',
    isUnlocked: false,
    description: 'Дух древнего леса',
  },
  {
    id: 11,
    name: 'Цветочная фея',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    price: 220,
    rarity: 'rare',
    category: 'nature',
    isUnlocked: false,
    description: 'Нежная фея цветов и растений',
  },

  // Космос
  {
    id: 12,
    name: 'Космический исследователь',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    price: 90,
    rarity: 'common',
    category: 'space',
    isUnlocked: false,
    description: 'Отважный покоритель космоса',
  },
  {
    id: 13,
    name: 'Звёздный навигатор',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    price: 250,
    rarity: 'rare',
    category: 'space',
    isUnlocked: false,
    description: 'Мастер межгалактических путешествий',
  },
  {
    id: 14,
    name: 'Галактический император',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    price: 600,
    rarity: 'legendary',
    category: 'space',
    isUnlocked: false,
    description: 'Владыка всей галактики',
  },
];
