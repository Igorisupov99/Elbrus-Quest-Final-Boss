'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ChatGameSession extends Model {
    static associate(models) {
      ChatGameSession.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      ChatGameSession.belongsTo(models.GameSession, {
        foreignKey: 'game_session_id',
        as: 'game_session'
      });
    }
  }
  ChatGameSession.init({
    user_id: DataTypes.BIGINT,
    game_session_id: DataTypes.BIGINT,
    message: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'ChatGameSession',
  });
  return ChatGameSession;
};