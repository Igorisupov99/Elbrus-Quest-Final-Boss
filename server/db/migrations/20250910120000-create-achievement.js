'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Achievements', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Уникальный ключ достижения'
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Название достижения'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Описание достижения'
      },
      icon: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Эмодзи или иконка достижения'
      },
      category: {
        type: Sequelize.ENUM('knowledge', 'exam', 'speed', 'persistence', 'social', 'score', 'special'),
        allowNull: false,
        comment: 'Категория достижения'
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Бонусные очки за получение достижения'
      },
      rarity: {
        type: Sequelize.ENUM('common', 'rare', 'epic', 'legendary'),
        allowNull: false,
        defaultValue: 'common',
        comment: 'Редкость достижения'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Активно ли достижение'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Создаем индексы для быстрого поиска
    await queryInterface.addIndex('Achievements', ['category'], {
      name: 'idx_achievements_category'
    });
    
    await queryInterface.addIndex('Achievements', ['rarity'], {
      name: 'idx_achievements_rarity'
    });

    await queryInterface.addIndex('Achievements', ['is_active'], {
      name: 'idx_achievements_active'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Achievements');
  }
};
