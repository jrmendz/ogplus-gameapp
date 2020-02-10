var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({
  identity: 'gameset',
  tableName: "t_gameset",
  connection: 'default',
  attributes: {
    id: {
      type: "integer",
      primaryKey: true,
      unique: true,
      autoIncrement: true,
      columnName: "id"
    },
    shoehandId: {
      type: "integer",
      columnName: "shoehand_id"
    },
    tableNumber: {
      type: "string",
      columnName: "table_number"
    },
    ended_at: {
      type: "string",
      columnName: "ended_at"
    },
    createdAt: {
      type: "string",
      columnName: "created_at"
    },
    updatedAt: {
      type: "string",
      columnName: "updated_at"
    }
  }
});
