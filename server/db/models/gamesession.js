'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GameSession extends Model {
    static associate(models) {
      GameSession.belongsTo(models.Phase, {
        foreignKey: 'phase_id',
        as: 'phase'
      });
      GameSession.belongsTo(models.Topic, {
        foreignKey: 'current_topic_id',
        as: 'current_topic'
      });
      GameSession.belongsTo(models.Question, {
        foreignKey: 'current_question_id',
        as: 'current_question'
      });
      GameSession.hasMany(models.UserSession, {
        foreignKey: 'game_session_id',
        as: 'user_sessions'
      });
      GameSession.hasMany(models.ChatGameSession, {
        foreignKey: 'game_session_id',
        as: 'chat_messages'
      });
    }
  }
  GameSession.init({
    phase_id: DataTypes.BIGINT,
    current_topic_id: DataTypes.BIGINT,
    current_question_id: DataTypes.BIGINT,
    room_code: DataTypes.TEXT,
    is_active: DataTypes.BOOLEAN,
    room_name: DataTypes.TEXT,
    room_creator: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'GameSession',
  });
  return GameSession;
};