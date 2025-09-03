'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserSession extends Model {
    static associate(models) {
      UserSession.belongsTo(models.GameSession, {
        foreignKey: 'game_session_id',
        as: 'game_session'
      });
      UserSession.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }
  UserSession.init({
    game_session_id: DataTypes.BIGINT,
    user_id: DataTypes.BIGINT,
    score: DataTypes.BIGINT,
    is_current_active: DataTypes.BOOLEAN,
    is_user_active: DataTypes.BOOLEAN,
    player_name: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'UserSession',
  });
  return UserSession;
};