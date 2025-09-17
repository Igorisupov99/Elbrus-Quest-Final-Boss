'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const avatars = [
      // Легендарные герои
      {
        name: 'Воин-спартанец',
        imageUrl: '/ChatGPT Image Sep 17, 2025, 08_15_17 PM.png',
        price: 50,
        rarity: 'common',
        category: 'fantasy',
        description: 'Могучий воин с мечом и щитом, готовый к битве',
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
        name: 'Драконий лорд',
        imageUrl: '/ChatGPT Image Sep 17, 2025, 08_21_49 PM.png',
        price: 800,
        rarity: 'legendary',
        category: 'fantasy',
        description: 'Могучий дракон с пламенным дыханием и древней мудростью',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Паладин света',
        imageUrl: '/ChatGPT Image Sep 17, 2025, 09_09_59 PM.png',
        price: 400,
        rarity: 'epic',
        category: 'fantasy',
        description: 'Святой воин в сияющих доспехах, защитник справедливости',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Шаман-оракул',
        imageUrl: '/ChatGPT Image Sep 17, 2025, 09_10_11 PM.png',
        price: 350,
        rarity: 'epic',
        category: 'fantasy',
        description:
          'Мистический шаман с черепом быка, связанный с духами предков',
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
        name: 'Эльфийка-лучница',
        imageUrl: '/ChatGPT Image Sep 17, 2025, 09_12_43 PM.png',
        price: 250,
        rarity: 'rare',
        category: 'fantasy',
        description:
          'Грациозная эльфийка с луком, чья стрела всегда находит цель',
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
