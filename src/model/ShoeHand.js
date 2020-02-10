var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({
  identity: 'shoehand',
  tableName: "c_shoehand",
  connection: 'default',
  attributes: {
    id: {
      type: "integer",
      unique: true,
      columnName: "id"
    },
    shoeHandNumber: {
      type: "string",
      columnName: "shoehandnumber"
    },
    shoe: {
      type: "integer",
      columnName: "shoe"
    },
    round: {
      type: "integer",
      columnName: "round"
    }
  },
  autoCreatedAt: false,
  autoUpdatedAt: false,
});
