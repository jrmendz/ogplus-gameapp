const WEB_SOCKET = require("ws");

let functions = {
  /**
   * Broadcast to Server Apps
   * @param msg
   */
  broadcastToGameApp: (msg = null) => {
    _.forEach(gameAppServers, (ws) => {
      if (ws.readyState === WEB_SOCKET.OPEN) {
        ws.send(JSON.stringify(msg || {}));
      }
    });
  },

  /**
   * Broadcast to Server Apps
   * @param msg
   * @param specificPlayer
   */
  broadcastToPlayers: (msg = null, specificPlayer = []) => {
    // Broadcast throttling (This is used to sync with video delays)
    setTimeout(() => {
      // Broadcast to specific players
      if (specificPlayer.length) {
        _.forEach(specificPlayer, (player) => {
          let client = players[player].ws;
          if (client.readyState === WEB_SOCKET.OPEN) client.send(JSON.stringify(msg || {}));
        });
      // Broadcast to all players
      } else {
        _.forEach(players, (player) => {
          let client = player.ws;
          if (client.readyState === WEB_SOCKET.OPEN) client.send(JSON.stringify(msg || {}));
        });
      }
    }, BROADCAST_THROTTLE_MS);
  },

  /**
   * Broadcast to Server Apps
   * @param msg
   * @param specificPlayer
   */
  broadcastToPlayersNoDelay: (msg = null, specificPlayer = []) => {
    // Broadcast to specific players
    if (specificPlayer.length) {
      _.forEach(specificPlayer, (player) => {
        let client = players[player].ws;
        if (client.readyState === WEB_SOCKET.OPEN) client.send(JSON.stringify(msg || {}));
      });
      // Broadcast to all players
    } else {
      _.forEach(players, (player) => {
        let client = player.ws;
        if (client.readyState === WEB_SOCKET.OPEN) client.send(JSON.stringify(msg || {}));
      });
    }
  },

  /**
   * Broadcast to Athens Server
   * @param msg
   * @param specificAthensServer
   */
  broadcastToAthens: (msg = null, specificAthensServer = []) => {
    // Broadcast throttling (This is used to sync with video delays)
    setTimeout(() => {
      // Broadcast to specific Athens Server
      if (specificAthensServer.length) {
        _.forEach(specificAthensServer, (server) => {
          let client = athensServer[server].ws;
          if (client.readyState === WEB_SOCKET.OPEN) client.send(JSON.stringify(msg || {}));
        });
        // Broadcast to all players
      } else {
        _.forEach(athensServer, (server) => {
          let client = server.ws;
          if (client.readyState === WEB_SOCKET.OPEN) client.send(JSON.stringify(msg || {}));
        });
      }
    }, BROADCAST_THROTTLE_MS);
  },

  /**
   * Broadcast to crash subscribers
   * @param msg
   */
  broadcastToCrashers: (msg = null) => {
    _.forEach(crashSubscriber, (ws) => {
      let client = ws.ws;
      if (client.readyState === WEB_SOCKET.OPEN) {
        client.send(JSON.stringify(msg || {}));
      }
    });
  },

  /**
   * Result prefix helper
   * @param result
   * @returns {string}
   */
  resultPrefix: (result = "") => {
    let INITIALS = [];
    let hasMatch = false;
    let mapper = {
      red: "RD",
      black: "BL",
      small: "SM",
      big: "BG",
      even: "E",
      odd: "O"
    };

    if (!result) return "";

    _.forEach(mapper, (v, k) => {
      if (_.includes(result, k)) {
        INITIALS.push(v);
        hasMatch = true;
      }
    });

    return hasMatch ? _.join(INITIALS, ",") : result;
  }
};

module.exports = functions;
