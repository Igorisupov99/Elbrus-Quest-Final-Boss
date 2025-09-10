'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserAchievements', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      achievement_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'Achievements',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      earned_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Когда было получено достижение'
      },
      game_session_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'GameSessions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'В какой игровой сессии было получено (если применимо)'
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Дополнительные данные о получении достижения (например, счет, время и т.д.)'
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

    // Создаем уникальный индекс - пользователь может получить каждое достижение только один раз
    await queryInterface.addIndex('UserAchievements', ['user_id', 'achievement_id'], {
      unique: true,
      name: 'idx_user_achievement_unique'
    });

    // Индекс для быстрого поиска достижений пользователя
    await queryInterface.addIndex('UserAchievements', ['user_id'], {
      name: 'idx_user_achievements_user'
    });

    // Индекс для поиска по игровой сессии
    await queryInterface.addIndex('UserAchievements', ['game_session_id'], {
      name: 'idx_user_achievements_session'
    });

    // Индекс для сортировки по времени получения
    await queryInterface.addIndex('UserAchievements', ['earned_at'], {
      name: 'idx_user_achievements_earned_at'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserAchievements');
  }
};
