'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Friendship extends Model {
    static associate(models) {
      // Связь с пользователем, который отправил запрос на дружбу
      Friendship.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      
      // Связь с пользователем, который получил запрос на дружбу
      Friendship.belongsTo(models.User, {
        foreignKey: 'friend_id',
        as: 'friend'
      });
    }
  }
  
  Friendship.init({
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    friend_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'blocked'),
      allowNull: false,
      defaultValue: 'pending'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Friendship',
    tableName: 'Friendships',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'friend_id'],
        name: 'unique_friendship'
      },
      {
        fields: ['user_id', 'status'],
        name: 'idx_friendships_user_status'
      },
      {
        fields: ['friend_id', 'status'],
        name: 'idx_friendships_friend_status'
      }
    ]
  });
  
  return Friendship;
};
