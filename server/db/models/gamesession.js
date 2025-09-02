'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GameSession extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      GameSession.belongsTo(models.User, {
        foreignKey: 'owner_id',
        as: 'owner',
      });

      GameSession.hasMany(models.ChatGameSession, {
        foreignKey: 'game_session_id',
        as: 'messages',
      });
    }
  }
  GameSession.init({
    name: DataTypes.STRING,
    status: DataTypes.STRING,
    owner_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'GameSession',
  });
  return GameSession;
};