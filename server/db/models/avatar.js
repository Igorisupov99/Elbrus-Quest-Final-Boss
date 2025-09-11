'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Avatar extends Model {
    static associate(models) {
      // Связь с пользователями через таблицу UserAvatars
      Avatar.belongsToMany(models.User, {
        through: models.UserAvatar,
        foreignKey: 'avatarId',
        otherKey: 'userId',
        as: 'users',
      });

      // Прямая связь с UserAvatar для получения дополнительных данных
      Avatar.hasMany(models.UserAvatar, {
        foreignKey: 'avatarId',
        as: 'user_avatars'
      });
    }
  }

  Avatar.init({
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    rarity: {
      type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
      allowNull: false,
      defaultValue: 'common',
    },
    category: {
      type: DataTypes.ENUM('animals', 'fantasy', 'robots', 'nature', 'space'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    sequelize,
    modelName: 'Avatar',
    tableName: 'avatars',
    timestamps: true,
  });

  return Avatar;
};
