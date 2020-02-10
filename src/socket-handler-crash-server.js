/**
 _________                         .__        _________
 \_   ___ \_______ _____     ______|  |__    /   _____/  ____ _______ ___  __  ____ _______
 /    \  \/\_  __ \\__  \   /  ___/|  |  \   \_____  \ _/ __ \\_  __ \\  \/ /_/ __ \\_  __ \
 \     \____|  | \/ / __ \_ \___ \ |   Y  \  /        \\  ___/ |  | \/ \   / \  ___/ |  | \/
  \______  /|__|   (____  //____  >|___|  / /_______  / \___  >|__|     \_/   \___  >|__|
         \/             \/      \/      \/          \/      \/                    \/
 */
const WEB_SOCKET = require("ws");
const ENV = connConfigs;
const COMMON_ACTIONS = require("./socket-actions");

let CRASH_WS_SERVER;
let nextId = 0;
let actions = {
  startServer: (cb) => {
    CRASH_WS_SERVER = new WEB_SOCKET.Server({ port: ENV.crashPort });

    CRASH_WS_SERVER.on("connection", (ws, req) => {
      ws.id = 'CRASH_SUBS_' + nextId++;

      COMMON_ACTIONS.openCrashSubscriber(ws, req.url, (err, user) => {
        if (err) {
          ws.send("NOT_AUTHORIZED");
          ws.close();
        } else {
          console.log('===== PLAYER CONNECTED [' + ws.id + '@' + user + '] =====');
        }
      });

      ws.on("message", () => {
        ws.send("POOOOFFFF! CANNOT ENTERTAIN YOUR COMMANDS");
      });

      ws.on("close", () => {
        COMMON_ACTIONS.closeCrashSubscriber(req.url, () => {});
      });

      ws.on("error", () => {
        ws.close();
      });
    });

    return cb();
  }
};

module.exports = actions;
