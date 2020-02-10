var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({
  identity: 'result',
  tableName: "t_results",
  connection: 'default',
  attributes: {
    id: {
      type: "integer",
      primaryKey: true,
      autoIncrement: true,
      columnName: "id"
    },
    idTableNo: {
      type: "integer",
      columnName: "table_id"
    },
    idShoeHand: {
      type: "integer",
      columnName: "shoehand_id"
    },
    idResultList: {
      type: "integer",
      columnName: "resultlist_id"
    },
    shoeDate: {
      type: "string",
      columnName: "shoe_date"
    },
    createdAt: {
      type: "string",
      columnName: "created_at"
    }
  },
  autoUpdatedAt: false,
});
