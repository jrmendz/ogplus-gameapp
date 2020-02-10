const Waterline = require("waterline");
const mysql = require("sails-mysql");
const connection = connConfigs.connections;
const TableNo = require("../model/TableNo");
const ShoeHand = require("../model/ShoeHand");
const ResultList = require("../model/ResultList");
const Result = require("../model/Result");
const GameValue = require("../model/GameValue");
const GameSet = require("../model/GameSet");
const Log = require("../model/Log");
const Dealer = require("../model/Dealer");
const waterline = new Waterline();

let ORM = {};

ORM.initialize = (cb) => {
  waterline.loadCollection(GameValue);
  waterline.loadCollection(GameSet);
  waterline.loadCollection(ShoeHand);
  waterline.loadCollection(TableNo);
  waterline.loadCollection(Result);
  waterline.loadCollection(ResultList);
  waterline.loadCollection(Log);
  waterline.loadCollection(Dealer);

  const config = {adapters: {mysql}, connections: {default: connection}, defaults:{migrate: "safe"}};

  waterline.initialize(config, function(err, wline) {
    if (err) return cb(err);

    global.GameSet = wline.collections.gameset;
    global.GameValue = wline.collections.gamevalue;
    global.Result = wline.collections.result;
    global.TableNo = wline.collections.tableno;
    global.ResultList = wline.collections.resultlist;
    global.ShoeHand = wline.collections.shoehand;
    global.Log = wline.collections.log;
    global.Dealer = wline.collections.dealer;

    return cb();
  });
};

module.exports = ORM;
