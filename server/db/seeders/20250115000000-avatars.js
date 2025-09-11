'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const avatars = [
      // Животные
      {
        name: 'Кот-воин',
        imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop&crop=face',
        price: 50,
        rarity: 'common',
        category: 'animals',
        description: 'Мудрый кот, готовый к приключениям',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Волк-защитник',
        imageUrl: 'https://images.unsplash.com/photo-1547407139-3c921a71905c?w=200&h=200&fit=crop&crop=face',
        price: 150,
        rarity: 'rare',
        category: 'animals',
        description: 'Благородный волк с силой духа',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Орёл-повелитель',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
        price: 300,
        rarity: 'epic',
        category: 'animals',
        description: 'Величественная птица, парящая над миром',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Фэнтези
      {
        name: 'Маг-элементалист',
        imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
        price: 75,
        rarity: 'common',
        category: 'fantasy',
        description: 'Мастер стихий с древними знаниями',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Эльф-стрелок',
        imageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face',
        price: 200,
        rarity: 'rare',
        category: 'fantasy',
        description: 'Изящный эльф с меткой стрелой',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Дракон-хранитель',
        imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
        price: 500,
        rarity: 'legendary',
        category: 'fantasy',
        description: 'Древний дракон, защищающий сокровища',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Роботы
      {
        name: 'Кибер-помощник',
        imageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
        price: 60,
        rarity: 'common',
        category: 'robots',
        description: 'Дружелюбный робот-компаньон',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Боевой дроид',
        imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
        price: 180,
        rarity: 'rare',
        category: 'robots',
        description: 'Высокотехнологичный воин будущего',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'ИИ-повелитель',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
        price: 400,
        rarity: 'epic',
        category: 'robots',
        description: 'Сверхразумный искусственный интеллект',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Природа
      {
        name: 'Древесный дух',
        imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
        price: 80,
        rarity: 'common',
        category: 'nature',
        description: 'Дух древнего леса',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Цветочная фея',
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
        price: 220,
        rarity: 'rare',
        category: 'nature',
        description: 'Нежная фея цветов и растений',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Космос
      {
        name: 'Космический исследователь',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
        price: 90,
        rarity: 'common',
        category: 'space',
        description: 'Отважный покоритель космоса',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Звёздный навигатор',
        imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
        price: 250,
        rarity: 'rare',
        category: 'space',
        description: 'Мастер межгалактических путешествий',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Галактический император',
        imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
        price: 600,
        rarity: 'legendary',
        category: 'space',
        description: 'Владыка всей галактики',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('avatars', avatars, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('avatars', null, {});
  }
};
