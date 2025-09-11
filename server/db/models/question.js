'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    static associate(models) {
      Question.belongsTo(models.Topic, {
        foreignKey: 'topic_id',
        as: 'topic'
      });
      Question.hasMany(models.EkzamenQuestion, {
        foreignKey: 'question_id',
        as: 'exam_records'
      });

      // Связи для избранных вопросов
      Question.belongsToMany(models.User, {
        through: models.UserFavoriteQuestion,
        foreignKey: 'question_id',
        otherKey: 'user_id',
        as: 'favorited_by_users'
      });

      Question.hasMany(models.UserFavoriteQuestion, {
        foreignKey: 'question_id',
        as: 'user_favorites'
      });
    }
  }
  Question.init({
    topic_id: DataTypes.BIGINT,
    question_text: DataTypes.TEXT,
    correct_answer: DataTypes.TEXT,
    question_type:DataTypes.TEXT,
    mentor_tip: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Question',
  });
  return Question;
};