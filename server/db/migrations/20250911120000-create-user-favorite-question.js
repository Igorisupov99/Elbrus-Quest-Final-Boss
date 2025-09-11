'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserFavoriteQuestions', {
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
      question_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'Questions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Создаем составной уникальный индекс, чтобы пользователь не мог добавить один вопрос в избранное дважды
    try {
      await queryInterface.addIndex('UserFavoriteQuestions', {
        fields: ['user_id', 'question_id'],
        unique: true,
        name: 'unique_user_question_favorite'
      });
    } catch (error) {
      if (!error.message.includes('уже существует') && !error.message.includes('already exists')) {
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserFavoriteQuestions');
  }
};
