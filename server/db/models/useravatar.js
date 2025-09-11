'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserAvatar extends Model {
    static associate(models) {
      UserAvatar.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });
      
      UserAvatar.belongsTo(models.Avatar, {
        foreignKey: 'avatarId',
        as: 'avatar',
      });
    }
  }

  UserAvatar.init({
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    avatarId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'avatars',
        key: 'id',
      },
    },
    isEquipped: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    purchasedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: 'UserAvatar',
    tableName: 'user_avatars',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'avatarId'],
      },
    ],
  });

  return UserAvatar;
};
