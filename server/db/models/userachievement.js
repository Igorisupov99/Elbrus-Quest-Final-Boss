'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserAchievement extends Model {
    static associate(models) {
      // Связь с пользователем
      UserAchievement.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      // Связь с достижением
      UserAchievement.belongsTo(models.Achievement, {
        foreignKey: 'achievement_id',
        as: 'achievement'
      });

      // Связь с игровой сессией (если достижение получено в конкретной сессии)
      UserAchievement.belongsTo(models.GameSession, {
        foreignKey: 'game_session_id',
        as: 'game_session'
      });
    }
  }

  UserAchievement.init({
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    achievement_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'Achievements',
        key: 'id'
      }
    },
    earned_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Когда было получено достижение'
    },
    game_session_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'GameSessions',
        key: 'id'
      },
      comment: 'В какой игровой сессии было получено (если применимо)'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Дополнительные данные о получении достижения (например, счет, время и т.д.)'
    }
  }, {
    sequelize,
    modelName: 'UserAchievement',
    tableName: 'UserAchievements',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'achievement_id'],
        name: 'idx_user_achievement_unique'
      },
      {
        fields: ['user_id'],
        name: 'idx_user_achievements_user'
      },
      {
        fields: ['game_session_id'],
        name: 'idx_user_achievements_session'
      },
      {
        fields: ['earned_at'],
        name: 'idx_user_achievements_earned_at'
      }
    ]
  });

  return UserAchievement;
};
