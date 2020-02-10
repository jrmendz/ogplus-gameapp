var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({
  identity: 'gamevalue',
  tableName: "t_game_values",
  connection: 'default',
  attributes: {
    id: {
      type: "integer",
      primaryKey: true,
      unique: true,
      columnName: "id"
    },
    values: {
      type: "json",
      columnName: "values"
    },
    gameType: {
      type: "integer",
      columnName: "game_type"
    },
    resultId: {
      type: "integer",
      columnName: "result_id"
    }
  },
  autoCreatedAt: false,
  autoUpdatedAt: false,
});
