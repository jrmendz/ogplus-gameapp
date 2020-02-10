/**
    ________                             _____                    _________                                          __
   /  _____/ _____     _____    ____    /  _  \  ______  ______   \_   ___ \   ____    ____    ____    ____   ____ _/  |_  ____ _______
 /   \  ___ \__  \   /     \ _/ __ \  /  /_\  \ \____ \ \____ \  /    \  \/  /  _ \  /    \  /    \ _/ __ \_/ ___\\   __\/  _ \\_  __ \
 \    \_\  \ / __ \_|  Y Y  \\  ___/ /    |    \|  |_> >|  |_> > \     \____(  <_> )|   |  \|   |  \\  ___/\  \___ |  | (  <_> )|  | \/
  \______  /(____  /|__|_|  / \___  >\____|__  /|   __/ |   __/   \______  / \____/ |___|  /|___|  / \___  >\___  >|__|  \____/ |__|
         \/      \/       \/      \/         \/ |__|    |__|             \/              \/      \/      \/     \/
 */
const WEB_SOCKET = require("ws");
const { setWsHeartbeat } = require("ws-heartbeat/client");
const ENV = connConfigs;
const COMMON_ACTIONS = require("./socket-actions");

let actions = {
  subscribeToGameApp: (gameCode = "") => {
    // Validators
    if (!gameCode) {
      console.log("Invalid Parameter: [gameCode]");
      return 0;
    }

    CONNECT();

    function CONNECT() {
      // Initiating variables
      let gameAppSocket = new WEB_SOCKET(ENV.gameUrl[gameCode]);

      setWsHeartbeat(gameAppSocket, '{"action":"ping"}', {
        pingTimeout: 60000, // in 60 seconds, if no message accepted from server, close the connection.
        pingInterval: 25000, // every 25 seconds, send a ping message to the server.
      });

      // Save GameApp server's websocket connection
      gameAppServers[gameCode] = gameAppSocket;

      // On-Connection
      gameAppSocket.on('open', (ws, req) => {
        // Check if the current server is connected previously and warned that the connection has been refreshed
        if (gameAppServers[gameCode]) {
          console.log("\033[33mWARNING: Connection to", gameCode.toUpperCase(), "has been refreshed.\033[0m");
        }
        console.log("\033[46m\033[30mSubscribed to Game-App Server [", gameCode.toUpperCase(), "]\033[0m");
        console.log("\033[36m" + gameCode.toUpperCase(), "URL:", ENV.gameUrl[gameCode], "\033[0m");
      });

      gameAppSocket.on('message', (data) => {
        // Handles GameApp servers messages
        COMMON_ACTIONS.serverAppHandler(gameAppSocket, data, gameCode, (err) => {
          if (err) {
            console.log("\033[31m[" + gameCode.toUpperCase() + "] ERROR INCOMMING COMMAND FROM GAME SERVER\033[0m");
            console.log("\033[31m[" + gameCode.toUpperCase() + "] REASON:", JSON.stringify(err), "\033[0m");
          }
        });
      });

      gameAppSocket.on('close', () => {
        console.info("Connection to %s game server closed. Reconnecting...", gameCode);
        // Reconnect within 1 second
        setTimeout(() => {
          CONNECT();
        }, 1000);
      });

      gameAppSocket.on('error', (err) => {
        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        console.log("\033[41m\033[30m<<< ERROR CONNECTING TO GAME-APP SERVER [", gameCode, "] >>>\033[0m");
        console.log("\033[41m\033[30m", gameCode.toUpperCase(), "URL:", ENV.gameUrl[gameCode], "\033[0m");
        console.log("\033[41m\033[30mREASON:", err.code, "\033[0m");
        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        gameAppSocket.close();
      });
    }
  }
};

module.exports = actions;
