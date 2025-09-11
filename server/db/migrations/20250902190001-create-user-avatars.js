'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_avatars', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      avatarId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'avatars',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      isEquipped: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      purchasedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Добавляем уникальный индекс для предотвращения дублирования
    await queryInterface.addIndex('user_avatars', {
      fields: ['userId', 'avatarId'],
      unique: true,
      name: 'user_avatars_user_avatar_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_avatars');
  }
};
