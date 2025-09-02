'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ChatMessage extends Model {
    static associate(models) {
      ChatMessage.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }
  ChatMessage.init({
    user_id: DataTypes.BIGINT,
    message: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'ChatMessage',
  });
  return ChatMessage;
};