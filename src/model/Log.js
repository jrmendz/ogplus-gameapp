var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({
  identity: 'log',
  tableName: "t_logs",
  connection: 'default',
  attributes: {
    id: {
      type: "integer",
      primaryKey: true,
      unique: true,
      autoIncrement: true,
      columnName: "id"
    },
    directory: {
      type: "string",
      columnName: "directory"
    },
    log_info: {
      type: "string",
      columnName: "log_info"
    },
    action: {
      type: "string",
      columnName: "action"
    },
    log_category_id: {
      type: "integer",
      columnName: "log_category_id"
    },
    created_at: {
      type: "string",
      columnName: "created_at"
    }
  }
});
