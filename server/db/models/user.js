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
    }
  }
  User.init({
    username: DataTypes.TEXT,
    email: DataTypes.TEXT,
    password_hash: DataTypes.TEXT,
    image_url: DataTypes.TEXT,
    role: DataTypes.TEXT,
    score: DataTypes.BIGINT,
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};