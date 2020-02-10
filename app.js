/*
  _________  __                   .__                  _________                   _____ .__
 /   _____/_/  |_ _____     ____  |__|  ____    ____   \_   ___ \   ____    ____ _/ ____\|__|  ____
 \_____  \ \   __\\__  \   / ___\ |  | /    \  / ___\  /    \  \/  /  _ \  /    \\   __\ |  | / ___\
 /        \ |  |   / __ \_/ /_/  >|  ||   |  \/ /_/  > \     \____(  <_> )|   |  \|  |   |  |/ /_/  >
/_______  / |__|  (____  /\___  / |__||___|  /\___  /   \______  / \____/ |___|  /|__|   |__|\___  /
        \/             \//_____/           \//_____/           \/              \/           /_____/
 */
global.appEnvironment = process.env.NODE_ENV || "development";

switch (appEnvironment.toLowerCase()) {
  case 'dev': case 'development':
    global.connConfigs = require("./config/env/development");
    break;

  case 'test': case 'testing':
    global.connConfigs = require("./config/env/testing");
    break;

  case 'prod': case 'production':
    global.connConfigs = require("./config/env/production");
    break;

  case 'loc': case 'local':
    global.connConfigs = require("./config/env/local");
    break;

  default:
    return console.log("Staging does not exists.");
}

require( "console-stamp" )( console, { pattern : "dd/mm/yyyy HH:MM:ss.l" } );
const _ = require("lodash");
const async = require("async");
const orm = require("./src/helpers/orm");
const GAME_APP_SERVER = require("./src/socket-handler-game-apps");
const PLAYER_SUBSCRIPTION_SERVER = require("./src/socket-handler-players");
// const CRASH_SUBSCRIPTION_SERVER = require("./src/socket-handler-crash-server");
// const AI = require("./src/game/AI");
let tasks;

global._ = _;
global.async = async;
global.gameAppServers = {};
global.tables = {};
global.athensServer = {};
global.athensTables = {};
global.disableFlag = [];
global.enableFlag = [];
global.players = {};
global.crashSubscriber = {};
global.BROADCAST_THROTTLE_MS = 6000;

tasks = [
  (cb) => {
    // Waterline initiation
    orm.initialize(cb);
  },
  // (cb) => {
  //   // Socket server that crash subscriber will connect.
  //   CRASH_SUBSCRIPTION_SERVER.startServer(cb);
  //   console.log("\033[46m\033[30mCRASH SERVER starts listening for subscriber...", "\033[0m");
  // },
  (cb) => {
    // Socket server that players will connect.
    PLAYER_SUBSCRIPTION_SERVER.startServer(cb);
    console.log("\033[46m\033[30mPLAYER SERVER starts listening for players...", "\033[0m");
  },
  (cb) => {
    // Start subscribing to Baccarat Game-App
    GAME_APP_SERVER.subscribeToGameApp("baccarat");
    return cb();
  },
  (cb) => {
    // Start subscribing to Dragon-Tiger Game-App
    GAME_APP_SERVER.subscribeToGameApp("dragontiger");
    return cb();
  },
  (cb) => {
    GAME_APP_SERVER.subscribeToGameApp("moneywheel");
    return cb();
  },
  (cb) => {
    GAME_APP_SERVER.subscribeToGameApp("roulette");
    // AI.roulette();
    return cb();
  }
];

async.series(tasks, (err) => {
  if (err) {
    console.log(err);
  }
  console.log('GameApp v2.0.64.0003');
  console.log("\033[46m\033[30mGAME SERVER running on port: ", connConfigs.port, "\033[0m");
  console.log("\033[46m\033[30mATHENS connection URL: ", connConfigs.athens, "\033[0m");

  if (BROADCAST_THROTTLE_MS > 0) {
    console.log("\033[43m\033[30mWARNING: Throttled Broadcast Sending . [" + BROADCAST_THROTTLE_MS + "ms]\033[0m");
  }
});
