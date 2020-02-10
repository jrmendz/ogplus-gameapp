const WEB_SOCKET = require("ws");
const GAME_SERVICES = require("./game/game-service");
const FUNCTION = require("./helpers/function");
let CACHE = require("./helpers/cache");
let ENV = connConfigs;
let subsDefaultCtr = 0, cmdSvrCtr = 0;
let actions = {
  /*
    _________                                        ___ ___                      .___.__
   /   _____/  ____ _______ ___  __  ____ _______   /   |   \ _____     ____    __| _/|  |    ____ _______
   \_____  \ _/ __ \\_  __ \\  \/ /_/ __ \\_  __ \ /    ~    \\__  \   /    \  / __ | |  |  _/ __ \\_  __ \
   /        \\  ___/ |  | \/ \   / \  ___/ |  | \/ \    Y    / / __ \_|   |  \/ /_/ | |  |__\  ___/ |  | \/
  /_______  / \___  >|__|     \_/   \___  >|__|     \___|_  / (____  /|___|  /\____ | |____/ \___  >|__|
          \/      \/                    \/                \/       \/      \/      \/            \/
   */
  serverAppHandler: function (ws = {}, dataParam = "", gameCode, cb) {
    let dataJSON, tableNumber, action, data;

    // console.log(dataParam);

    // 1st level of validation
    if (_.isEmpty(ws))  return cb("Invalid Parameter: [ws]");
    if (!dataParam)     return cb("Invalid Parameter: [data]");

    // console.log(JSON.stringify(dataParam))

    dataJSON = jsonParseSafe(dataParam) || {};
    action = dataJSON.action;
    tableNumber = dataJSON.tableNumber;
    data = dataJSON.data;

    // 2nd level of validation
    if (!action) {
      console.log("\033[31mInvalid data from", gameCode.toUpperCase() + " :", JSON.stringify(dataParam), "\033[0m");
      return cb("Missing [action] object provided on message.");
    }

    if (!tableNumber) {
      console.log("\033[31mData Received:" + JSON.stringify(dataParam), "\033[0m");
      return cb("Missing [tableNumber] object provided on message.");
    }

    if (!data) {
      console.log("\033[31mData Received:" + JSON.stringify(dataParam), "\033[0m");
      return cb("Missing [data] object provided on message.");
    }

    if (action !== "tables") {
      if (tableNumber !== "GAME_SERVER") {
        if(_.isUndefined(tables[tableNumber]))
          return cb("Table [" + tableNumber + "] not ready.");

        // If disabled, any incoming action command from table cannot be processed
        if (tables[tableNumber].DISABLED) {
          console.log("\033[33m ******** DISABLED TABLE ********", "\033[0m");
          console.log("\033[33m " + tableNumber + " action cannot be processed.", "\033[0m");
          console.log("\033[33m ********************************", "\033[0m");
          return cb();
        }
      }
    }

    switch (action) {
      /*
        _________.__                      ________
       /   _____/|  |__    ____    ____  /  _____/ _____     _____    ____
       \_____  \ |  |  \  /  _ \ _/ __ \/   \  ___ \__  \   /     \ _/ __ \
       /        \|   Y  \(  <_> )\  ___/\    \_\  \ / __ \_|  Y Y  \\  ___/
      /_______  /|___|  / \____/  \___  >\______  /(____  /|__|_|  / \___  >
              \/      \/              \/        \/      \/       \/      \/
       */
      case "shoeGame":
        GAME_SERVICES.shoeGame({
          tableNumber: tableNumber,
          data: data
        }, (err, dataRes) => {
          if (err) {
            console.log("\033[31mERROR ACTION [shoeGame]:", JSON.stringify(err), "\033[0m");
            return cb(err);
          }

          console.log("\033[32m[" + tableNumber + "] Shoe and GameSet has been relayed to players.", "\033[0m");

          FUNCTION.broadcastToPlayers({
            tables: {
              [tableNumber]: dataRes
            }
          });

          FUNCTION.broadcastToAthens({
            action: "table",
            data: {
              [tableNumber]: dataRes
            }
          });

          return cb(err, dataRes);
        });
        break;
      /*
      __________                        .__    __
      \______   \  ____    ______ __ __ |  | _/  |_  ______
       |       _/_/ __ \  /  ___/|  |  \|  | \   __\/  ___/
       |    |   \\  ___/  \___ \ |  |  /|  |__|  |  \___ \
       |____|_  / \___  >/____  >|____/ |____/|__| /____  >
              \/      \/      \/                        \/
       */
      case "broadcast":
        GAME_SERVICES.result({
          tableNumber: tableNumber,
          data: data
        }, (err, dataRes) => {
          if (err) {
            console.log("\033[31mERROR ACTION [broadcast]:", JSON.stringify(err), "\033[0m");
            return cb(err);
          }

          console.log("\033[32m[" + tableNumber + "] Partial result has been relayed to players.", "\033[0m");
          // console.log(JSON.stringify(dataRes));

          FUNCTION.broadcastToPlayers({
            tables: {
              [tableNumber]: dataRes
            }
          });
          return cb(err, dataRes);
        });
        break;
      /*
        _________  __            __
       /   _____/_/  |_ _____  _/  |_  __ __  ______
       \_____  \ \   __\\__  \ \   __\|  |  \/  ___/
       /        \ |  |   / __ \_|  |  |  |  /\___ \
      /_______  / |__|  (____  /|__|  |____//____  >
              \/             \/                  \/
       */
      case "status":
        GAME_SERVICES.status({
          tableNumber: tableNumber,
          data: data
        }, (err, dataRes) => {
          if (err) {
            console.log("\033[31mERROR ACTION [status]:", JSON.stringify(err), "\033[0m");
            return cb(err);
          }

          console.log("\033[32m[" + tableNumber + "] Status [" + dataRes.status.toUpperCase() + "] has been relayed to players.", "\033[0m");

          FUNCTION.broadcastToPlayers({
            tables: {
              [tableNumber]: dataRes
            }
          });

          FUNCTION.broadcastToAthens({
            action: "table",
            data: {
              [tableNumber]: {
                isBetting: dataRes.status === 'betting',
                status: dataRes.status
              }
            }
          });
          return cb(err, dataRes);
        });
        break;
      /*
      ___________.__
      \__    ___/|__|  _____    ____ _______
        |    |   |  | /     \ _/ __ \\_  __ \
        |    |   |  ||  Y Y  \\  ___/ |  | \/
        |____|   |__||__|_|  / \___  >|__|
                           \/      \/
      */
      case "timer":
        GAME_SERVICES.timer({
          tableNumber: tableNumber,
          data: data
        }, (err, dataRes) => {
          if (err) {
            console.log("\033[31mERROR ACTION [timer]:", JSON.stringify(err), "\033[0m");
            return cb(err);
          }

          FUNCTION.broadcastToPlayers({
            tables: {
              [tableNumber]: dataRes
            }
          });
          return cb(err, dataRes);
        });
        break;
      /*
      ________                   .__
      \______ \    ____  _____   |  |    ____ _______
       |    |  \ _/ __ \ \__  \  |  |  _/ __ \\_  __ \
       |    `   \\  ___/  / __ \_|  |__\  ___/ |  | \/
      /_______  / \___  >(____  /|____/ \___  >|__|
              \/      \/      \/            \/
       */
      case "dealer":
        GAME_SERVICES.dealer({
          tableNumber: tableNumber,
          data: data
        }, (err, dataRes) => {
          if (err) {
            console.log("\033[31mERROR ACTION [dealer]:", JSON.stringify(err), "\033[0m");
            return cb(err);
          }

          FUNCTION.broadcastToPlayers({
            tables: {
              [tableNumber]: dataRes
            }
          });
          return cb(err, dataRes);
        });
        break;

      /*
      __________                                 __
      \______   \_____   ___.__.  ____   __ __ _/  |_
       |     ___/\__  \ <   |  | /  _ \ |  |  \\   __\
       |    |     / __ \_\___  |(  <_> )|  |  / |  |
       |____|    (____  // ____| \____/ |____/  |__|
                      \/ \/
       */
      case "payout":
        GAME_SERVICES.payout({
          tableNumber: tableNumber,
          data: data
        });
        break;

      /*
      __________
      \______   \_______   ____    ____   ____    ______  ______
       |     ___/\_  __ \ /  _ \ _/ ___\_/ __ \  /  ___/ /  ___/
       |    |     |  | \/(  <_> )\  \___\  ___/  \___ \  \___ \
       |____|     |__|    \____/  \___  >\___  >/____  >/____  >
                                      \/     \/      \/      \/
       */
      case "process":
        GAME_SERVICES.process({
          tableNumber: tableNumber,
          data: data
        }, (err, dataRes) => {
          if (err) {
            console.log("\033[31mERROR ACTION [process]:", err, "\033[0m");
            return cb(err);
          }

          return cb(err, dataRes);
        });
        break;

      /*
      __________                    .___ ____   ____.__     .___
      \______   \  ____ _____     __| _/ \   \ /   /|__|  __| _/ ____   ____
       |       _/ /  _ \\__  \   / __ |   \   Y   / |  | / __ |_/ __ \ /  _ \
       |    |   \(  <_> )/ __ \_/ /_/ |    \     /  |  |/ /_/ |\  ___/(  <_> )
       |____|_  / \____/(____  /\____ |     \___/   |__|\____ | \___  >\____/
              \/             \/      \/                      \/     \/
       */
      case "roadVideo":
        GAME_SERVICES.roadVideo({
          tableNumber: tableNumber,
          data: data
        }, (err, dataRes) => {
          if (err) {
            console.log("\033[31mERROR ACTION [roadVideo]:", JSON.stringify(err), "\033[0m");
            return cb(err);
          }

          FUNCTION.broadcastToPlayers({
            tables: {
              [tableNumber]: dataRes
            }
          });
          return cb(err, dataRes);
        });
        break;

      /*
      ________   .__                                                        __
      \______ \  |__|  ______  ____   ____    ____    ____    ____   ____ _/  |_
       |    |  \ |  | /  ___/_/ ___\ /  _ \  /    \  /    \ _/ __ \_/ ___\\   __\
       |    `   \|  | \___ \ \  \___(  <_> )|   |  \|   |  \\  ___/\  \___ |  |
      /_______  /|__|/____  > \___  >\____/ |___|  /|___|  / \___  >\___  >|__|
              \/          \/      \/             \/      \/      \/     \/
         */
      case "disconnect":
        GAME_SERVICES.disconnect({
          tableNumber: tableNumber,
          data: data
        }, (err, dataRes) => {
          if (err) {
            console.log("\033[31mERROR ACTION [disconnect]:", JSON.stringify(err), "\033[0m");
            return cb(err);
          }

          FUNCTION.broadcastToPlayers({
            tables: {
              [tableNumber]: dataRes
            }
          });
          return cb(err, dataRes);
        });
        break;

      /*
      ___________       ___.    .__
      \__    ___/_____  \_ |__  |  |    ____    ______
        |    |   \__  \  | __ \ |  |  _/ __ \  /  ___/
        |    |    / __ \_| \_\ \|  |__\  ___/  \___ \
        |____|   (____  /|___  /|____/ \___  >/____  >
                      \/     \/            \/      \/
       */
      case "tables":
        // Just merge all received table info to our global variable [tables]
        _.assign(tables, data);

        // Assign information need by Athens
        _.forEach(data, (v, k) => {
          _.assign(athensTables, {
            [k]: { isBetting: false }
          })
        });

        // console.log(dataParam);
        return cb();

      case "update_tables":
        _.merge(tables, data.tables);

        console.log("\033[32m[" + tableNumber + "] Updated table information has been relayed to players.", "\033[0m");

        // Broadcast to players the table information
        FUNCTION.broadcastToPlayers(data);
        break;
      /*
      ___________          __                       .___
      \_   _____/___  ____/  |_   ____    ____    __| _/
       |    __)_ \  \/  /\   __\_/ __ \  /    \  / __ |
       |        \ >    <  |  |  \  ___/ |   |  \/ /_/ |
      /_______  //__/\_ \ |__|   \___  >|___|  /\____ |
              \/       \/            \/      \/      \/
       */
      case "extend":
        console.log("\033[36m[" + gameCode.toUpperCase() + "]:", "EXTEND FUNCTION IS INACTIVE", "\033[0m");
        return cb();

      case "pong":
        console.log("\033[42m\033[30m[" + gameCode.toUpperCase() + "]:", " <3<3<3 Heart-Beating <3<3<3", "\033[0m");
        return cb();

      default:
        return cb("Invalid Action. Cannot continue processing [" + action + "] from " + tableNumber);
    }
  },

  /*
    _________                       __________ .__                                  _________                                          __   .__
   /   _____/_____  ___  __  ____   \______   \|  |  _____   ___.__.  ____ _______  \_   ___ \   ____    ____    ____    ____   ____ _/  |_ |__|  ____    ____
   \_____  \ \__  \ \  \/ /_/ __ \   |     ___/|  |  \__  \ <   |  |_/ __ \\_  __ \ /    \  \/  /  _ \  /    \  /    \ _/ __ \_/ ___\\   __\|  | /  _ \  /    \
   /        \ / __ \_\   / \  ___/   |    |    |  |__ / __ \_\___  |\  ___/ |  | \/ \     \____(  <_> )|   |  \|   |  \\  ___/\  \___ |  |  |  |(  <_> )|   |  \
  /_______  /(____  / \_/   \___  >  |____|    |____/(____  // ____| \___  >|__|     \______  / \____/ |___|  /|___|  / \___  >\___  >|__|  |__| \____/ |___|  /
          \/      \/            \/                        \/ \/          \/                 \/              \/      \/      \/     \/                        \/
   */
  openPlayerConnection: function (ws = {}, url = "", cb) {
    let urlSplit, token, cmdUser, tmpUserName, serverAlias;

    if (_.isEmpty(ws))      return cb("Invalid Parameter: [WebSocket Not Initialized]");
    if (_.isUndefined(url)) return cb("Invalid Parameter: [url]");

    urlSplit = url.split("/");

    if (urlSplit.length !== 2) {
      return cb("Invalid URL Connection String. [" + url + "]");
    } else {
      token = urlSplit[1];
    }

    if (!token) return cb("Invalid URL Connection String. [" + url + "]");
    // Check if command key user
    cmdUser = _.find(ENV.cmdKey, { key: token });

    // Check if the token is in command key list
    if (!_.isUndefined(cmdUser)) {
      cmdSvrCtr++;
      // Create temporary name if no name entered
      tmpUserName = cmdUser.server || ("SERVER_" + cmdSvrCtr);
      serverAlias = cmdUser.server + "_CONN_" + cmdSvrCtr;

      console.log("\033[43m\033[30m", "***** COMMAND KEY ACTIVATED/ACCESSED BY: [", serverAlias, "] *****\033[0m");

      // Save athens' connection information
      athensServer[serverAlias] = { ws: ws, username: tmpUserName };
      console.log("\033[43m\033[30m", "Server connection has been saved. [", tmpUserName, "]\033[0m");

      if (ws.readyState === WEB_SOCKET.OPEN) {
        ws.send(JSON.stringify({
          action: "table",
          data: athensTables
        }));
      }

      return cb(null, tmpUserName);
    } else {
      CACHE.get(token, (err, user) => {
        if (err) return cb(err);

        // Check if the user is valid
        if (!user) return cb("Player not authenticate.");

        if (players[token]) {
          // Close other existing player connection and add the socket
          players[token].ws.close();
          console.log("Player connection has been refreshed.");
        }
        // Save player's connection information
        players[token] = { ws: ws, username: user.username };

        if (ws.readyState === WEB_SOCKET.OPEN) {
          ws.send(JSON.stringify({ tables }));
        }
        return cb(null, user.username);
      });
    }
  },

  /*
  _________                         .__        _________      ___.
  \_   ___ \_______ _____     ______|  |__    /   _____/ __ __\_ |__    ______
  /    \  \/\_  __ \\__  \   /  ___/|  |  \   \_____  \ |  |  \| __ \  /  ___/
  \     \____|  | \/ / __ \_ \___ \ |   Y  \  /        \|  |  /| \_\ \ \___ \
   \______  /|__|   (____  //____  >|___|  / /_______  /|____/ |___  //____  >
          \/             \/      \/      \/          \/            \/      \/
      /[secret-key]/[Subscriber_Custom_Name]
   */
  openCrashSubscriber: function (ws = {}, url = "", cb) {
    const secretList = ["secretKey01", "secretKey02"];
    let urlSplit, secret;

    if (_.isEmpty(ws))      return cb("Invalid Parameter: [WebSocket Not Initialized]");
    if (_.isUndefined(url)) return cb("Invalid Parameter: [url]");

    urlSplit = url.split("/");

    if (!urlSplit[1]) {
      return cb("Invalid URL Connection String. [" + url + "]");
    } else {
      secret = urlSplit[1];
    }

    if (!secret) {
      return cb("Invalid URL Connection String. [" + url + "]");
    }
    // Check if the secret key is valid
    if (_.includes(secretList, secret)) {
      if (crashSubscriber[secret]) {
        // Close other existing player connection and add the socket
        crashSubscriber[secret].ws.close();
        console.log("Player connection has been refreshed.");
      }
      // Save player's connection information
      crashSubscriber[secret] = {
        ws: ws,
        name: secret || ("SUBS_" + subsDefaultCtr++)
      };

      return cb(null, secret);
    } else {
      return cb("Player not authenticate.");
    }
  },


  closeCrashSubscriber: function (url, cb) {
    let urlSplit, client, user;

    if (!url) return cb("Invalid Parameter: [url]");

    urlSplit = url.split("/");
    client = urlSplit[1];
    user = crashSubscriber[client].name;

    if (!client) return cb("Invalid Connection String");
    if (_.isUndefined(user)) return cb("No crash subscriber found.");

    // Remove connection from player list
    _.omit(crashSubscriber, [client]);
    return cb(null, user.username);
  },

  /*
  _________  .__                           __________ .__                                  _________                                          __   .__
  \_   ___ \ |  |    ____   ______  ____   \______   \|  |  _____   ___.__.  ____ _______  \_   ___ \   ____    ____    ____    ____   ____ _/  |_ |__|  ____    ____
  /    \  \/ |  |   /  _ \ /  ___/_/ __ \   |     ___/|  |  \__  \ <   |  |_/ __ \\_  __ \ /    \  \/  /  _ \  /    \  /    \ _/ __ \_/ ___\\   __\|  | /  _ \  /    \
  \     \____|  |__(  <_> )\___ \ \  ___/   |    |    |  |__ / __ \_\___  |\  ___/ |  | \/ \     \____(  <_> )|   |  \|   |  \\  ___/\  \___ |  |  |  |(  <_> )|   |  \
   \______  /|____/ \____//____  > \___  >  |____|    |____/(____  // ____| \___  >|__|     \______  / \____/ |___|  /|___|  / \___  >\___  >|__|  |__| \____/ |___|  /
          \/                   \/      \/                        \/ \/          \/                 \/              \/      \/      \/     \/                        \/
   */
  closePlayerConnection: (url = "", cb) => {
    let urlSplit, token, user;

    if (!url) return cb("Invalid Parameter: [url]");

    urlSplit = url.split("/");
    token = urlSplit[1];
    user = players[token];

    if (!token) return cb("Invalid Connection String");
    if (_.isUndefined(user)) return cb("No user found for that token.");

    // Remove connection from player list
    _.omit(players, [token]);
    return cb(null, user.username);
  },

  /*
  __________ .__                                  _________                                                .___
  \______   \|  |  _____   ___.__.  ____ _______  \_   ___ \   ____    _____    _____  _____     ____    __| _/ ______
   |     ___/|  |  \__  \ <   |  |_/ __ \\_  __ \ /    \  \/  /  _ \  /     \  /     \ \__  \   /    \  / __ | /  ___/
   |    |    |  |__ / __ \_\___  |\  ___/ |  | \/ \     \____(  <_> )|  Y Y  \|  Y Y  \ / __ \_|   |  \/ /_/ | \___ \
   |____|    |____/(____  // ____| \___  >|__|     \______  / \____/ |__|_|  /|__|_|  /(____  /|___|  /\____ |/____  >
                        \/ \/          \/                 \/               \/       \/      \/      \/      \/     \/
   */
  playerCommands: (ws = {}, url = "", data, cb) => {
    let message = jsonParseSafe(data);
    let gameApp;

    if (_.isEmpty(ws))      return cb("Invalid Parameter: [ws]");
    if (_.isNull(message))  return cb("Invalid Parameter: [data]");
    if (message.code)       return cb("Invalid Parameter: [data.code]");

    gameApp = gameAppServers[message.code];

    switch(_.toLower(message.command)) {
      /*
      ___________          __                       .___
      \_   _____/___  ____/  |_   ____    ____    __| _/
       |    __)_ \  \/  /\   __\_/ __ \  /    \  / __ |
       |        \ >    <  |  |  \  ___/ |   |  \/ /_/ |
      /_______  //__/\_ \ |__|   \___  >|___|  /\____ |
              \/       \/            \/      \/      \/
       */
      case "extend":
        if (gameApp) {
          if (gameApp.readyState === WEB_SOCKET.OPEN) {
            gameApp.send(JSON.stringify(message));
          }
        } else {
          return cb("Invalid GameApp Server: [" + message.code + "]")
        }
        break;

      /*
      ________   .__                ___.    .__            ___________       ___.    .__
      \______ \  |__|  ___________  \_ |__  |  |    ____   \__    ___/_____  \_ |__  |  |    ____
       |    |  \ |  | /  ___/\__  \  | __ \ |  |  _/ __ \    |    |   \__  \  | __ \ |  |  _/ __ \
       |    `   \|  | \___ \  / __ \_| \_\ \|  |__\  ___/    |    |    / __ \_| \_\ \|  |__\  ___/
      /_______  /|__|/____  >(____  /|___  /|____/ \___  >   |____|   (____  /|___  /|____/ \___  >
              \/          \/      \/     \/            \/                  \/     \/            \/
       */
      case "disable_table":
        if (_.isUndefined(message.tableNumber) || !message.tableNumber)
          return cb("Invalid Parameter: [tableNumber] " + typeof message.tableNumber)
        if (tables[message.tableNumber].status !== "default") {
          // Add to queue and will check when status change to default.
          disableFlag.push(message.tableNumber);

          console.log("\033[43m\033[30mTable [" + message.tableNumber + "] will be DISABLED on the next round.", "\033[0m");
          return cb();
        }

        // Set disabled flag to table
        _.assign(tables[message.tableNumber], { DISABLED: true, status: "disconnected" });

        console.log("\033[43m\033[30m[" + message.tableNumber + "] has been DISABLED by command.", "\033[0m");

        // Broadcast table disconnected status
        FUNCTION.broadcastToPlayers({
          tables: {
            [message.tableNumber]: {
              status: "disconnected"
            }
          }
        });
        break;

      /*
      ___________               ___.    .__            ___________       ___.    .__
      \_   _____/  ____  _____  \_ |__  |  |    ____   \__    ___/_____  \_ |__  |  |    ____
       |    __)_  /    \ \__  \  | __ \ |  |  _/ __ \    |    |   \__  \  | __ \ |  |  _/ __ \
       |        \|   |  \ / __ \_| \_\ \|  |__\  ___/    |    |    / __ \_| \_\ \|  |__\  ___/
      /_______  /|___|  /(____  /|___  /|____/ \___  >   |____|   (____  /|___  /|____/ \___  >
              \/      \/      \/     \/            \/                  \/     \/            \/
       */
      case "enable_table":
        if (_.isUndefined(message.tableNumber) || !message.tableNumber)
          return cb("Invalid Parameter: [tableNumber] " + typeof message.tableNumber)

        // Set enable flag to table
        _.assign(tables[message.tableNumber], { DISABLED: false });

        console.log("\033[43m\033[30m[" + message.tableNumber + "] has been ENABLED by command.", "\033[0m");

        // Broadcast table default status
        FUNCTION.broadcastToPlayers({
          tables: {
            [message.tableNumber]: {
              status: "default"
            }
          }
        });
        break;
      /*
        _________         __    ___________                        __
       /   _____/  ____ _/  |_  \_   _____/___  __  ____    ____ _/  |_  ______
       \_____  \ _/ __ \\   __\  |    __)_ \  \/ /_/ __ \  /    \\   __\/  ___/
       /        \\  ___/ |  |    |        \ \   / \  ___/ |   |  \|  |  \___ \
      /_______  / \___  >|__|   /_______  /  \_/   \___  >|___|  /|__| /____  >
              \/      \/                \/             \/      \/           \/
       */
      case "set_event":
        let eventInfo;

        // Validators
        if (_.isUndefined(message.tables))
          return cb("Invalid Parameter: [tables]");
        if (_.isUndefined(message.events))
          return cb ("Invalid Parameter: [events]");
        if (_.isEmpty(message.tables))
          return cb("Invalid Parameter format: [tables] Should not be empty.");

        /*
          events: {
            id: <Integer>,
            name: <String>,
            description: <String>,
            start: <String>,
            end: <String>,
            enabled: <Boolean>,
            hasCountDown: <Boolean>
          }
        */
        // Pre-setting variables
        eventInfo = {
          events: message.events
        };

        // Set event on tables
        _.assign(tables[message.tableNumber], eventInfo);

        console.log("\033[43m\033[30m[" + _.join(message.tables) + "] has been set", message.events.length, "event(s) by command.", "\033[0m");

        // Send table events
        _.map(message.tables, (table) => {
          // Broadcast table events
          FUNCTION.broadcastToPlayers({
            tables: {
              [table]: eventInfo
            }
          });
        });

        break;

      /*
       ____ ___             .___         __            ___________       ___.    .__            .___          _____
      |    |   \______    __| _/_____  _/  |_   ____   \__    ___/_____  \_ |__  |  |    ____   |   |  ____ _/ ____\____
      |    |   /\____ \  / __ | \__  \ \   __\_/ __ \    |    |   \__  \  | __ \ |  |  _/ __ \  |   | /    \\   __\/  _ \
      |    |  / |  |_> >/ /_/ |  / __ \_|  |  \  ___/    |    |    / __ \_| \_\ \|  |__\  ___/  |   ||   |  \|  | (  <_> )
      |______/  |   __/ \____ | (____  /|__|   \___  >   |____|   (____  /|___  /|____/ \___  > |___||___|  /|__|  \____/
                |__|         \/      \/            \/                  \/     \/            \/            \/
       */
      case "update_tables_info":
        FUNCTION.broadcastToGameApp({
          action: "update_tables"
        });
        break;


      /*
      __________ ________ __________  __________                            .___                         __
      \______   \\_____  \\______   \ \______   \_______   ____ _____     __| _/ ____  _____     _______/  |_   ____ _______
       |     ___/ /  ____/ |     ___/  |    |  _/\_  __ \ /  _ \\__  \   / __ |_/ ___\ \__  \   /  ___/\   __\_/ __ \\_  __ \
       |    |    /       \ |    |      |    |   \ |  | \/(  <_> )/ __ \_/ /_/ |\  \___  / __ \_ \___ \  |  |  \  ___/ |  | \/
       |____|    \_______ \|____|      |______  / |__|    \____/(____  /\____ | \___  >(____  //____  > |__|   \___  >|__|
                         \/                   \/                     \/      \/     \/      \/      \/             \/
       */

      case "broadcast_to_players":
        FUNCTION.broadcastToPlayersNoDelay({
          action: _.get(message, "data.action", ""),
          tableNumber: _.get(message, "data.tableNumber", ""),
          data: _.get(message, "data.data", ""),
        });
        break;

      /*
      ________    __   .__
      \_____  \ _/  |_ |  |__    ____ _______  ______
       /   |   \\   __\|  |  \ _/ __ \\_  __ \/  ___/
      /    |    \|  |  |   Y  \\  ___/ |  | \/\___ \
      \_______  /|__|  |___|  / \___  >|__|  /____  >
              \/            \/      \/            \/
       */
      default:
        // Ping-Pong Response-Reply
        if (data === '{"heartBeat":"PING"}') {
          console.log("\033[32m======== <3 PLAYER'S HEART-BEAT <3 ========\033[0m");
          // Reply pong
          if (ws.readyState === WEB_SOCKET.OPEN) ws.send(JSON.stringify({ heartBeat : "PONG" }));
        }
        break;
    }

    return cb();
  }
};

/**
 * JSON Parse alternative with error handling
 * @param string
 * @returns {*}
 */
function jsonParseSafe (string) {
  try { return JSON.parse(string) } catch (ex) { return null }
}


module.exports = actions;
