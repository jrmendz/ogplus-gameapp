var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({
  identity: 'dealer',
  connection: 'default',
  tableName: 't_dealers',
  attributes: {
    id: {
      type: 'number',
      unique: true,
      autoIncrement: true
    },
    dealerscode: {
      type: 'number',
      unique: true,
      required: true,
    },
    fullname: {
      type: 'string',
      unique: true,
      required: true
    },
    nickname: {
      type: 'string',
      required: true
    },
    height: {
      type: 'string',
      defaultsTo: '5\'0',
      allowNull: true
    },
    vitalstats: {
      type: 'string',
      defaultsTo: '0 A, 0 0',
      allowNull: true
    },
    hobbies: {
      type: 'string',
      defaultsTo: '',
      allowNull: true
    },
    birthday: {
      type: 'ref',
      columnType: 'date',
      defaultsTo: '1900-01-01'
    },
    imagegrand: {
      type: 'string',
      allowNull: true
    },
    imageprestige: {
      type: 'string',
      allowNull: true
    },
    imageclassic: {
      type: 'string',
      allowNull: true
    },
    imagemanbetx: {
      type: 'string',
      allowNull: true
    },
    imagestreamer: {
      type: 'string',
      allowNull: true
    },
    languages: {
      type: 'string',
      allowNull: true
    },
    tableLocation: {
      type: 'string',
      defaultsTo: 'Lobby'
    }
  },
  autoCreatedAt: false,
  autoUpdatedAt: false
});
