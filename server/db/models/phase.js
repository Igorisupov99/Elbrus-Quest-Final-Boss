'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Phase extends Model {
    static associate(models) {
      Phase.hasMany(models.Topic, {
        foreignKey: 'phase_id',
        as: 'topics'
      });
      Phase.hasMany(models.GameSession, {
        foreignKey: 'phase_id',
        as: 'game_sessions'
      });
      Phase.hasMany(models.EkzamenQuestion, {
        foreignKey: 'phase_id',
        as: 'exam_questions'
      });
    }
  }
  Phase.init({
    title: DataTypes.TEXT,
    description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Phase',
  });
  return Phase;
};