'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const avatars = [
      // Легендарные герои
      {
        name: 'Тёмный маг',
        imageUrl: '/ChatGPT Image Sep 17, 2025, 08_15_17 PM.png',
        price: 50,
        rarity: 'common',
        category: 'fantasy',
        description: 'Могучий маг с посохом, владеющий тёмной магией',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Тёмный странник',
        imageUrl: '/ChatGPT Image Sep 17, 2025, 08_01_02 PM.png',
        price: 300,
        rarity: 'epic',
        category: 'fantasy',
        description: 'Загадочная фигура в капюшоне, хранящая тайны',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Крестоносец',
        imageUrl: '/ChatGPT Image Sep 17, 2025, 08_21_49 PM.png',
        price: 800,
        rarity: 'legendary',
        category: 'fantasy',
        description: 'Крестоносец, защитник веры, правды и справедливости',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Эльф-лучник',
        imageUrl: '/ChatGPT Image Sep 17, 2025, 09_09_59 PM.png',
        price: 400,
        rarity: 'epic',
        category: 'fantasy',
        description: 'Изящный эльф с меткой стрелой и острым слухом',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Древний дракон',
        imageUrl: '/ChatGPT Image Sep 17, 2025, 09_10_11 PM.png',
        price: 350,
        rarity: 'epic',
        category: 'fantasy',
        description: 'Древний дракон, защищающий сокровища',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Верховный маг',
        imageUrl: '/ChatGPT Image Sep 17, 2025, 09_10_26 PM.png',
        price: 600,
        rarity: 'legendary',
        category: 'fantasy',
        description:
          'Архимаг в короне власти, повелитель всех магических искусств',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Рыцарь-стражник',
        imageUrl: '/ChatGPT Image Sep 17, 2025, 09_12_34 PM.png',
        price: 200,
        rarity: 'rare',
        category: 'fantasy',
        description: 'Закованный в броню страж с верным мечом у бока',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Дух леса',
        imageUrl: '/ChatGPT Image Sep 17, 2025, 09_12_43 PM.png',
        price: 250,
        rarity: 'rare',
        category: 'fantasy',
        description: 'Дух леса, владеющий древней мудростью и силой природы',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Древодуховник',
        imageUrl: '/ChatGPT Image Sep 17, 2025, 09_12_54 PM.png',
        price: 450,
        rarity: 'epic',
        category: 'fantasy',
        description: 'Древний дух леса, воплощение мудрости и силы природы',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert('avatars', avatars, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('avatars', null, {});
  },
};
