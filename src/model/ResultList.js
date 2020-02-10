var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({
  identity: 'resultlist',
  tableName: "c_resultlist",
  connection: 'default',
  attributes: {
    id: {
      type: "integer",
      primaryKey: true,
      unique: true,
      columnName: "id"
    },
    results: {
      type: "string",
      columnName: "result"
    },
    prefix: {
      type: "string",
      columnName: "prefix"
    }
  },
  autoCreatedAt: false,
  autoUpdatedAt: false,
});
