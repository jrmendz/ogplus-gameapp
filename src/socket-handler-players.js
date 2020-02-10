/**
 __________ .__                                    _________
 \______   \|  |  _____   ___.__.  ____ _______   /   _____/  ____ _______ ___  __  ____ _______
 |     ___/|  |  \__  \ <   |  |_/ __ \\_  __ \  \_____  \ _/ __ \\_  __ \\  \/ /_/ __ \\_  __ \
 |    |    |  |__ / __ \_\___  |\  ___/ |  | \/  /        \\  ___/ |  | \/ \   / \  ___/ |  | \/
 |____|    |____/(____  // ____| \___  >|__|    /_______  / \___  >|__|     \_/   \___  >|__|
                      \/ \/          \/                 \/      \/                    \/
 */
const WEB_SOCKET = require("ws");
const ENV = connConfigs;
const COMMON_ACTIONS = require("./socket-actions");

let PLAYER_WS_SERVER;
let nextId = 0;
let actions = {
  startServer: (cb) => {
    PLAYER_WS_SERVER = new WEB_SOCKET.Server({ port: ENV.port });

    PLAYER_WS_SERVER.on("connection", (ws, req) => {
      ws.id = 'PLAYER_CONNECTION_' + nextId++;

      COMMON_ACTIONS.openPlayerConnection(ws, req.url, (err, user) => {
        if (err) {
          ws.send("NOT_AUTHORIZED_GO_LOGOUT");
          ws.close();
        } else {
          console.log('===== PLAYER CONNECTED [' + ws.id + '@' + user + '] =====');
        }
      });

      ws.on("message", (data) => {
        COMMON_ACTIONS.playerCommands(ws, req.url, data, (err) => {
          if (err) {
            console.log("\033[31m", '===== PLAYER COMMAND REJECTED =====', "\033[0m");
            console.log("\033[31m", "REASON: ", JSON.stringify(err), "\033[0m");
          }
        });
      });

      ws.on("close", () => {
        COMMON_ACTIONS.closePlayerConnection(req.url, (err) => {});
      });

      ws.on("error", () => {
        ws.close();
      });
    });

    return cb();
  }
};

module.exports = actions;
