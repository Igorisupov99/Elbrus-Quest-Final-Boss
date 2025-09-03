'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Topic extends Model {
    static associate(models) {
      Topic.belongsTo(models.Phase, {
        foreignKey: 'phase_id',
        as: 'phase'
      });
      Topic.hasMany(models.Question, {
        foreignKey: 'topic_id',
        as: 'questions'
      });
    }
  }
  Topic.init({
    phase_id: DataTypes.BIGINT,
    title: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Topic',
  });
  return Topic;
};