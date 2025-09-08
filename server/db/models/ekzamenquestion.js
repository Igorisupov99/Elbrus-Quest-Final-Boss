'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EkzamenQuestion extends Model {
    static associate(models) {
      EkzamenQuestion.belongsTo(models.GameSession, {
        foreignKey: 'game_session_id',
        as: 'game_session'
      });
      EkzamenQuestion.belongsTo(models.Phase, {
        foreignKey: 'phase_id',
        as: 'phase'
      });
      EkzamenQuestion.belongsTo(models.Topic, {
        foreignKey: 'topic_id',
        as: 'topic'
      });
      EkzamenQuestion.belongsTo(models.Question, {
        foreignKey: 'question_id',
        as: 'question'
      });
    }
  }
  EkzamenQuestion.init({
    game_session_id: DataTypes.BIGINT,
    phase_id: DataTypes.BIGINT,
    topic_id: DataTypes.BIGINT,
    question_id: DataTypes.BIGINT,
    is_correct: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null
    },
    user_answer: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'EkzamenQuestion',
  });
  return EkzamenQuestion;
};