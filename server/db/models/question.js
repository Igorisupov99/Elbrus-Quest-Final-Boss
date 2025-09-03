'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    static associate(models) {
      Question.belongsTo(models.Topic, {
        foreignKey: 'topic_id',
        as: 'topic'
      });
    }
  }
  Question.init({
    topic_id: DataTypes.BIGINT,
    question_text: DataTypes.TEXT,
    correct_answer: DataTypes.TEXT,
    mentor_tip: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Question',
  });
  return Question;
};