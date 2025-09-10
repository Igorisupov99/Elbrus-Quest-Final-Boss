'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.UserSession, {
        foreignKey: 'user_id',
        as: 'user_sessions'
      });
      User.hasMany(models.ChatGameSession, {
        foreignKey: 'user_id',
        as: 'chat_messages'
      });
      User.hasMany(models.ChatMessage, {
        foreignKey: 'user_id',
        as: 'global_chat_messages'
      });
      
      // Связи для системы друзей
      // Друзья, которых добавил этот пользователь
      User.hasMany(models.Friendship, {
        foreignKey: 'user_id',
        as: 'sent_friendships'
      });
      
      // Друзья, которые добавили этого пользователя
      User.hasMany(models.Friendship, {
        foreignKey: 'friend_id',
        as: 'received_friendships'
      });
      
      // Друзья через связь many-to-many
      User.belongsToMany(models.User, {
        through: {
          model: models.Friendship,
          unique: false
        },
        foreignKey: 'user_id',
        otherKey: 'friend_id',
        as: 'friends'
      });
      
      // Обратная связь для друзей
      User.belongsToMany(models.User, {
        through: {
          model: models.Friendship,
          unique: false
        },
        foreignKey: 'friend_id',
        otherKey: 'user_id',
        as: 'friend_of'
      });
    }
  }
  User.init({
    username: DataTypes.TEXT,
    email: DataTypes.TEXT,
    password_hash: DataTypes.TEXT,
    image_url: DataTypes.TEXT,
    role: DataTypes.TEXT,
    score: DataTypes.BIGINT,
    games_completed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};