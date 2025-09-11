'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Achievement extends Model {
    static associate(models) {
      // Связь с пользователями через таблицу UserAchievements
      Achievement.belongsToMany(models.User, {
        through: models.UserAchievement,
        foreignKey: 'achievement_id',
        otherKey: 'user_id',
        as: 'users'
      });

      // Прямая связь с UserAchievement для получения дополнительных данных
      Achievement.hasMany(models.UserAchievement, {
        foreignKey: 'achievement_id',
        as: 'user_achievements'
      });
    }
  }

  Achievement.init({
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Уникальный ключ достижения'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'Название достижения'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Описание достижения'
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Эмодзи или иконка достижения'
    },
    category: {
      type: DataTypes.ENUM('knowledge', 'exam', 'speed', 'persistence', 'social', 'score', 'special'),
      allowNull: false,
      comment: 'Категория достижения'
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Бонусные очки за получение достижения'
    },
    rarity: {
      type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
      allowNull: false,
      defaultValue: 'common',
      comment: 'Редкость достижения'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Активно ли достижение'
    }
  }, {
    sequelize,
    modelName: 'Achievement',
    tableName: 'Achievements',
    timestamps: true,
    indexes: [
      {
        fields: ['category'],
        name: 'idx_achievements_category'
      },
      {
        fields: ['rarity'],
        name: 'idx_achievements_rarity'
      },
      {
        fields: ['is_active'],
        name: 'idx_achievements_active'
      }
    ]
  });

  return Achievement;
};
