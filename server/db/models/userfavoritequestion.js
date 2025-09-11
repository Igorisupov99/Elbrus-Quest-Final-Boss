'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserFavoriteQuestion extends Model {
    static associate(models) {
      UserFavoriteQuestion.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      
      UserFavoriteQuestion.belongsTo(models.Question, {
        foreignKey: 'question_id',
        as: 'question'
      });
    }
  }
  
  UserFavoriteQuestion.init({
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    question_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'UserFavoriteQuestion',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'question_id'],
        name: 'unique_user_question_favorite'
      }
    ]
  });
  
  return UserFavoriteQuestion;
};
