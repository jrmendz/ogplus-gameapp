let CACHE = require("../helpers/cache");
let FUNCTION = require("../helpers/function");
let HTTP = require("request");
let ENV = connConfigs;

let services = {
  /*
    _________.__                      ________
   /   _____/|  |__    ____    ____  /  _____/ _____     _____    ____
   \_____  \ |  |  \  /  _ \ _/ __ \/   \  ___ \__  \   /     \ _/ __ \
   /        \|   Y  \(  <_> )\  ___/\    \_\  \ / __ \_|  Y Y  \\  ___/
  /_______  /|___|  / \____/  \___  >\______  /(____  /|__|_|  / \___  >
          \/      \/              \/        \/      \/       \/      \/
   */
  shoeGame: (data, cb) => {
    let shoeGame, tableNumber, cacheKeyGameSet, cacheKeyShoeGame, cacheKeyRoad, cacheKeyTotal, shoeSplit, gameType, tasks;

    // console.log(JSON.stringify(data));

    if (_.isUndefined(data))                  return cb("Invalid Parameter: [data]");
    if (_.isUndefined(data.tableNumber))      return cb("Invalid Parameter: [data.tableNumber]");
    if (_.isUndefined(data.data.shoeGame))    return cb("Invalid Parameter: [data.shoeGame]");
    if (_.isUndefined(data.data.gameType))    return cb("Invalid Parameter: [data.gameType]");

    shoeGame = data.data.shoeGame;
    gameType = data.data.gameType;
    shoeSplit = shoeGame.split("-");
    tableNumber = data.tableNumber;
    cacheKeyGameSet = "gameSet_" + tableNumber;
    cacheKeyShoeGame = "shoehand_" + tableNumber;
    cacheKeyRoad = "road_" + tableNumber + (gameType === "roulette" ? "_rlt" : "");
    cacheKeyTotal = "total_" + tableNumber;

    tasks = {
      savingShoeCache: (cb) => {
        CACHE.set(cacheKeyShoeGame, shoeGame, 60 * 60 * 24,(err) => {
          if (err) return cb(err);
          return cb(null, shoeGame);
        });
      },

      shoeInfo: ["savingShoeCache", (arg, cb) => {
        ShoeHand.findOrCreate({
          shoeHandNumber: shoeGame
        }, {
          shoeHandNumber: shoeGame,
          shoe: shoeSplit[0],
          round: shoeSplit[1]
        }).exec(async function(err, result) {
          if (err) return cb(err);

          if (_.isUndefined(result.id)) {
            ShoeHand.findOne({ shoeHandNumber: result.shoeHandNumber }, cb);
          } else {
            return cb(null, result || {})
          }
        });
      }],

      resetCache: ["shoeInfo", (arg, cb) => {
        let cacheData;

        // Check if the round is 1 reset and clear cached data or if the game is roulette and shoeGame is 1
        if (_.includes(["roulette", "moneywheel"], gameType)) {
          if (shoeGame.toString() !== "1") {
            console.log("\033[36m[" + tableNumber + "] INFO: Reset shoe SKIPPED.", "\033[0m");
            return cb();
          }
        } else {
          if (shoeGame.split("-")[1] !== "1") {
            console.log("\033[36m[" + tableNumber + "] INFO: Reset shoe SKIPPED.", "\033[0m");
            return cb();
          }
        }

        // Set default total result
        switch (gameType) {
          case "baccarat":    cacheData = { totalResult: { player: 0, banker: 0, tie: 0, bankerPair: 0, playerPair: 0 } }; break;
          case "dragontiger": cacheData = { totalResult: { dragon: 0, tiger: 0, tie: 0 } }; break;
          case "moneywheel":  cacheData = { totalResult: { "1": 0, "2": 0, "5": 0, "10": 0, "20": 0, "og": 0 } }; break;
        }

        tables[tableNumber].totalResult = cacheData;

        // Clear data result cache
        async.series([
          (cb) => {
            CACHE.set(cacheKeyShoeGame, shoeGame, 60 * 60 * 24, cb);
          },
          (cb) => {
            // IMPORTANT: Cache key road map of roulette was added `_rlt` to isolate mobile road map and desktop
            CACHE.set(cacheKeyRoad, { road: [] }, 60 * 60 * 24, cb);
          },
          (cb) => {
            CACHE.set(cacheKeyTotal, cacheData, 60 * 60 * 24, cb);
          }
        ], (err) => {
          if (err) return cb(err);
          console.log("\033[36m[" + tableNumber + "] INFO: Reset cached shoe, roads, and totals SUCCESSFUL.", "\033[0m");
          return cb(err, arg);
        });

      }],

      checkingCrashTable: ["resetCache", "shoeInfo", (arg, cb) => {
        let CRASHED_TABLE_KEY = "CRASHED_" + tableNumber;

        if (_.isUndefined(arg.shoeInfo.id))
          return cb("Missing Shoe-Hand Information");

        console.log("\033[36m[" + tableNumber + "] INFO: ShoeGameID [" + arg.shoeInfo.id + "].", "\033[0m");
        async.waterfall([
          (cb) => {
            // Check if the previous table has a crashed record
            CACHE.get(CRASHED_TABLE_KEY, cb);
          },
          (_crashed, cb) => {
            // If has a crashed table saved
            if (_crashed) {
              console.log("\033[43m\033[30m[" + tableNumber + "] INFO: Resuming disconnected table [", + _crashed.gameSet + "@" + _crashed.shoeGame ,"]\033[0m");

              if (_crashed.shoeGame !== shoeGame) {
                console.log("\033[33m[" + tableNumber + "] ====== WARNING! Previously crashed table shoe is not the same with dealer input. =====", "\033[0m");
                console.log("\033[33m[" + tableNumber + "] CRASHED_TBL:", _crashed.shoeGame, "\033[0m");
                console.log("\033[33m[" + tableNumber + "] DEALER_SENT:", shoeGame, "\033[0m");
              }

              // Set table information from cached tables
              tables[tableNumber] = _crashed;
              // Delete cached Crashed Table Information
              CACHE.delete(CRASHED_TABLE_KEY, (err) => {
                if (!err) console.log("\033[36m[" + tableNumber + "] INFO: Crashed table has been remove from cached.", "\033[0m");

                return cb(err, {
                  id: _crashed.gameSet
                });
              });
              // If no crashed record
            } else {
              // Generate new gameSet
              GameSet.create({ shoehandId: arg.shoeInfo.id, tableNumber: tableNumber}).exec((err, data) => {
                if (err) return cb(err);
                console.log("\033[36m[" + tableNumber + "] INFO: GameSet Saved! [" + data.id + "].", "\033[0m");
                return cb(err, data);
              });
            }
          }
        ], cb);

      }],

      cacheGameSet: ["checkingCrashTable", (arg, cb) => {
        CACHE.set(cacheKeyGameSet, {
          gameSet: arg.checkingCrashTable.id,
          shoeGame: shoeGame
        } ,60 * 60 * 24, (err) => {
          if (err) return cb(err);
          console.log("\033[36m[" + tableNumber + "] INFO: GameSet Cached! [" + arg.checkingCrashTable.id + "@" + shoeGame + "].", "\033[0m");
          return cb(err, arg);
        });
      }]
    };

    async.auto(tasks, (err, result) => {
      if (err) return cb(err);
      // Update global tables
      tables[tableNumber].shoeGame = shoeGame;
      tables[tableNumber].gameSet = result.checkingCrashTable.id;
      // Return processed data
      return cb(null, {
        shoeGame: shoeGame,
        gameSet: result.checkingCrashTable.id
      });
    });
  },

  /*
  __________                        .__    __
  \______   \  ____    ______ __ __ |  | _/  |_
   |       _/_/ __ \  /  ___/|  |  \|  | \   __\
   |    |   \\  ___/  \___ \ |  |  /|  |__|  |
   |____|_  / \___  >/____  >|____/ |____/|__|
          \/      \/      \/
   */
  result: (data, cb) => {
    // Validators
    if (_.isUndefined(data.tableNumber)) return cb("Invalid Parameter: [data.tableNumber]");
    // No computation just relay the result to players
    // Update global tables
    _.assign(tables[data.tableNumber], data.data);
    // Return processed data
    return cb(null, data.data);
  },

  /*
    _________  __            __
   /   _____/_/  |_ _____  _/  |_  __ __  ______
   \_____  \ \   __\\__  \ \   __\|  |  \/  ___/
   /        \ |  |   / __ \_|  |  |  |  /\___ \
  /_______  / |__|  (____  /|__|  |____//____  >
          \/             \/                  \/
   */
  status: (data, cb) => {
    let status, gameType, tableNumber;
    // Validators
    if (_.isUndefined(data.tableNumber)) return cb("Invalid Parameter: [data.tableNumber]");
    if (_.isUndefined(data.data.status)) return cb("Invalid Parameter: [data.data.status]");
    if (_.isUndefined(data.data.gameType)) return cb("Invalid Parameter: [data.data.gameType]");

    status = data.data.status;
    gameType = data.data.gameType;
    tableNumber = data.tableNumber;

    // Check if the table has existing DISABLE flag
    if (status === "default" && _.includes(disableFlag, tableNumber)) {
      // Set disabled flag to table
      _.assign(tables[tableNumber], { DISABLED: true });
      // Remove tableNumber from disableFlag
      _.pull(disableFlag, tableNumber);

      console.log("\033[43m\033[30m", "[", tableNumber, "] has been DISABLED by command.", "\033[0m");

      // Update global tables
      tables[tableNumber].status = status;

      // Return processed data
      return cb(null, {
        status: "disconnected"
      });
    }

    // Update global tables
    tables[tableNumber].status = status;

    // No computation just relay the status to players
    console.log("\033[36m[" + tableNumber + "] INFO: Status is " + status.toUpperCase() + ".", "\033[0m");

    // Send GoodTips Computations when it's betting status, disregard moneywheel & roulette from computing games
    if (status === "betting" && !_.includes(["moneywheel", "roulette"], gameType)) {
      // Send Throttled GoodTips
      setTimeout(() => {
        HTTP.post( {
          headers: { 'content-type' :  'application/x-www-form-urlencoded' },
          url: ENV.athens + 'getGoodTips/',
          body: 'params=' + JSON.stringify({ tableNumber }, null, ' '),
        }, function (err) {
          if (err) {
            console.log('\033[31mError Sending GoodTips Command: ' + err);
            console.log('\033[31mREASON:', JSON.stringify(err));
          } else {
            console.log("\033[33m[" + tableNumber + "] ===== GOOD TIPS REQUEST SUCCESS =====", "\033[0m");
          }
        });

        if (BROADCAST_THROTTLE_MS > 0) {
          console.log("\033[33m[" + tableNumber + "] INFO: Throttled API Good-Tips Sending. [" + BROADCAST_THROTTLE_MS + "ms]\033[0m");
        }
      }, BROADCAST_THROTTLE_MS);
    }
    // Return processed data
    return cb(null, data.data);
  },

  /*
  ___________.__
  \__    ___/|__|  _____    ____ _______
    |    |   |  | /     \ _/ __ \\_  __ \
    |    |   |  ||  Y Y  \\  ___/ |  | \/
    |____|   |__||__|_|  / \___  >|__|
                       \/      \/
   */
  timer: (data, cb) => {
    // Validators
    if (_.isUndefined(data.tableNumber)) return cb("Invalid Parameter: [data.tableNumber]");
    // No computation just relay the timer to players
    // Update global tables
    // console.log(JSON.stringify(data.data));
    _.assign(tables[data.tableNumber], data.data);
    return cb(null, data.data);
  },

  /*
  ________                   .__
  \______ \    ____  _____   |  |    ____ _______
   |    |  \ _/ __ \ \__  \  |  |  _/ __ \\_  __ \
   |    `   \\  ___/  / __ \_|  |__\  ___/ |  | \/
  /_______  / \___  >(____  /|____/ \___  >|__|
          \/      \/      \/            \/
   */
  dealer: (data = {}, cb) => {
    // Validators
    if (_.isUndefined(data.tableNumber))
      return cb("Invalid Parameter: [data.tableNumber]");
    if (_.isUndefined(data.data.dealer))
      return cb("Invalid Parameter: [data.data.dealer]");
    if (data.data.dealer.rid === tables[data.tableNumber].dealer.rid) {
      console.log("\033[35m[" + data.tableNumber + "] INFO: Dealer already seated. [", data.data.dealer.name, "@", data.data.dealer.rid, "]\033[0m");
      _.assign(tables[data.tableNumber], data.data);
      return cb(null, data.data);
    }

    async.parallel([
      (cb) => {
        // Update location of newly seated dealer
        Dealer.update({ dealerscode: data.data.dealer.rid }, { tableLocation: data.tableNumber }, cb);
      },
      (cb) => {
        if (!tables[data.tableNumber].dealer) {
          console.log("\033[35m[" + data.tableNumber + "] INFO: No previous dealer seated. \033[0m");
          return cb()
        }
        // Update location of previously seated dealer to Lobby
        Dealer.update({ dealerscode: tables[data.tableNumber].dealer.rid }, { tableLocation: "Lobby" }, cb);
      }
    ], (err) => {
      if (err) {
        console.log(err);
        return cb("Dealer Location Update Failed");
      }

      console.log("\033[35m[" + data.tableNumber + "] INFO: Dealer has been seated. [", data.data.dealer.name, "@", data.data.dealer.rid, "]\033[0m");

      // No computation just relay the dealer info to players
      _.assign(tables[data.tableNumber], data.data);
      return cb(null, data.data);
    });
  },

  /*
  __________
  \______   \_______   ____    ____   ____    ______  ______
   |     ___/\_  __ \ /  _ \ _/ ___\_/ __ \  /  ___/ /  ___/
   |    |     |  | \/(  <_> )\  \___\  ___/  \___ \  \___ \
   |____|     |__|    \____/  \___  >\___  >/____  >/____  >
                                  \/     \/      \/      \/
   */
  process: (data, cb) => {
    let tasks, tableNumber, result, shoeDate, shoeGame, gameResult, roadPartial, counter, gameName, gameSet;

    if (_.isUndefined(data))                return cb("Invalid Parameter: [data]");
    if (_.isUndefined(data.tableNumber))    return cb("Invalid Parameter: [data.tableNumber]");
    if (_.isUndefined(data.data.result))    return cb("Invalid Parameter: [data.data.result]");
    if (_.isUndefined(data.data.shoeDate))  return cb("Invalid Parameter: [data.data.shoeDate]");
    if (_.isUndefined(data.data.gameName))  return cb("Invalid Parameter: [data.data.gameName]");
    if (_.isEmpty(data.data.gameResult))    return cb("Invalid Parameter: [data.data.gameResult]");
    if (_.isEmpty(data.data.roadPartial))   return cb("Invalid Parameter: [data.data.roadPartial]");
    if (_.isEmpty(data.data.counter))       return cb("Invalid Parameter: [data.data.counter]");

    tableNumber = data.tableNumber;
    gameName = data.data.gameName;
    gameResult = data.data.gameResult;
    result = data.data.result ? (gameName === "roulette" ? gameResult.value : data.data.result) : gameName === "roulette" ? 0 : "";
    shoeDate = data.data.shoeDate;
    roadPartial = data.data.roadPartial;
    counter = data.data.counter;
    gameSet = _.get(tables, `[${tableNumber}].gameSet`, null);
    shoeGame = _.get(tables, `[${tableNumber}].shoeGame`, null);

    console.log(`| #1 PROCESS - ${gameSet} | : Received Data ${JSON.stringify({ tableNumber, gameName, result, gameSet, shoeGame})}`);

    tasks = {
      getShoeHand: (cb) => {
        console.log(`| #2 PROCESS - ${gameSet} | : Getting shoe-hand information.`);
        const cacheKey = "shoehand_" + tableNumber;

        if (!shoeGame) {
          CACHE.get(cacheKey, (err, value) => {
            if (err)    return cb(err); // Return error
            if (!value) return cb("Invalid ShoeGame: [No shoeHand record found on cache and local object]");

            // Get ShoeHand Information
            console.log(`| #2.1 PROCESS - ${gameSet} | : Shoe-game ${value} has been pulled (Cache).`);
            ShoeHand.findOne({ shoehandnumber: value }, cb);
          })
        } else {
          // Get ShoeHand Information
          console.log(`| #2.1 PROCESS - ${gameSet} | : Shoe-game ${shoeGame} has been pulled. (Global Variable).`);
          ShoeHand.findOne({ shoehandnumber: shoeGame }, cb);
        }
      },

      getTableNo: (cb) => {
        console.log(`| #3 PROCESS - ${gameSet} | : Getting table ${tableNumber} information.`);
        TableNo.findOne({ tableNumber }, cb);
      },

      getResultList: (cb) => {
        console.log(`| #4 PROCESS - ${gameSet} | : Getting result list information on table ${tableNumber}.`);
        ResultList.findOne({ results: result }, cb);
      },

      saveResult: ["getShoeHand", "getTableNo", "getResultList", (results, cb) => {
        console.log(`| #5 PROCESS - ${gameSet} | : Saving results of table ${tableNumber}.`);
        const cacheKey = `result_${tableNumber}_${gameSet}`;
        let shoeHand = results.getShoeHand;
        let tableNo = results.getTableNo;
        let resultList = results.getResultList;

        if (_.isUndefined(shoeHand))   return cb({ error: "Invalid ShoeHand"});
        if (_.isUndefined(tableNo))    return cb({ error: "Invalid tableNo"});
        if (_.isUndefined(resultList)) return cb({ error: "Invalid resultList"});

        Result.create({
          idTableNo: tableNo.id,
          idShoeHand: shoeHand.id,
          idResultList: resultList.id,
          shoeDate: shoeDate,
        }, (err, savedResult) => {
          if (err) return cb({ error: err });
          // ToDo: New Implementation
          // console.log("\033[36m[" + tableNumber + "]",'INFO: ResultID [' + savedResult.id + '] generated!', "\033[0m");
          // return cb(err, savedResult);
          console.log(`| #5.1 PROCESS - ${gameSet} | : Game result saved. ${tableNumber}. ${JSON.stringify({tableID: tableNo.id, shoeId: shoeHand.id, resultListId: resultList.id })}`);
          // Set cache the game result
          CACHE.set(cacheKey, savedResult, 60 * 60 * 24, (err) => {
            console.log(`| #5.2 PROCESS - ${gameSet} | : Game result of table ${tableNumber} has been saved to cache. ${JSON.stringify(savedResult)}`);
            return cb(err, savedResult);
          });
        });
      }],

      saveGameValue: ["saveResult", (arg, cb) => {
        console.log(`| #6 PROCESS - ${gameSet} | : Saving game values of table ${tableNumber}. ${JSON.stringify(gameResult)}`);
        // Save game values
        GameValue.create({
          values: JSON.stringify(gameResult),
          game_type: arg.getTableNo.game_code_id,
          result_id: arg.saveResult.id
        }, (err, result) => {
          if (err) return cb(err);
          console.log(`| #6.1 PROCESS - ${gameSet} | : Game values of table ${tableNumber} saved. ${JSON.stringify(result)}`);
          return cb(err, result);
        });
      }],

      callAthensPayout: ['saveGameValue', 'saveResult', 'getShoeHand', 'getTableNo', 'getResultList', (arg, next) => {
        // ToDo: New Implementation
        // const payLoad = {
        //   tableNumber,
        //   tableId: _.get(arg.getTableNo, 'id', null),
        //   gameSet,
        //   shoeId: _.get(arg.getShoeHand, 'id', null),
        //   resultId: _.get(arg.saveResult, 'id', null),
        //   resultListId: _.get(arg.getResultList, 'id', null),
        //   gameType: gameName
        // };
        const payLoad = {
          shoeHandNumber: shoeGame,
          shoeDate: shoeDate,
          cacheKey: `result_${tableNumber}_${gameSet}`,
          gameType: gameName,
          gameSet: gameSet,
          tableNumber: tableNumber
        };
        let tryCount = 1;
        console.log(`| #7p PROCESS - ${gameSet} | : Calling PAYOUT end-point on Athens ${tableNumber}. ${JSON.stringify(payLoad)}`);

        let athensPayout = (done) => {
          console.log(`| #7.1p PROCESS - ${gameSet} | : Payout execute request ${tryCount} time(s).`);

          HTTP.post({
            url: ENV.athens + 'transaction/payout',
            body: payLoad,
            json: true
          }, (err, response, body) => {
            if (err) {
              tryCount++;
              return done(err);
            }

            // Response body must be an object this will catch 500 error response by Athens API
            if (!_.isObject(body)) {
              tryCount++;
              return done(body);
            }

            // Return success
            return done(null, body);
          });
        };

        // We delay the payout to match with the front-end broadcast delay, without a delay the payout will be calculated in advance
        setTimeout( () => {
          // This will retry Athens API saving 5 times if failed
          async.retry({ times: 1, interval: 200 }, athensPayout, (err, data) => {
            if (err) {
              console.log(`| #7.2p PROCESS - ${gameSet} | : Response from ATHENS. ${JSON.stringify(err)}.`);
              console.log(`| #7.2p PROCESS - ${gameSet} | : Payout calculation failed on ${tableNumber}.`);
              return next(err);
            }

            console.log(`| #7.2p PROCESS - ${gameSet} | : Response from ATHENS. ${JSON.stringify(data)}.`);
            console.log(`| #7.2p PROCESS - ${gameSet} | : Payout calculation successful on ${tableNumber}.`);

            // Clearing result from cache
            CACHE.delete(`result_${tableNumber}_${gameSet}`, (err) => {
              if (err) {
                console.log(`| #7.2p PROCESS - ${gameSet} | : Clearing result from cache failed. CACHE KEY:[result_${tableNumber}_${gameSet}]`);
                return next(err);
              }

              console.log(`| #7.3p PROCESS - ${gameSet} | : Clearing result from cache successful. CACHE KEY:[result_${tableNumber}_${gameSet}]`);
              return next();
            });
          });

        }, BROADCAST_THROTTLE_MS);
      }],

      startCaching: ["saveGameValue", (arg, cb) => {
        console.log(`| #7p PROCESS - ${gameSet} | : Caching relative information [Partial RoadMap, Total Counts] ${tableNumber}.`);

        let cacheKeyRoad = "road_" + tableNumber + (gameName === "roulette" ? "_rlt" : "");
        let cacheKeyLastRoad = "road_lastRoadPartial_" + tableNumber;
        let cacheKeyTotal = "total_" + tableNumber;

        async.parallel([
          // Caching RoadMap
          (cb) => {
            CACHE.get(cacheKeyRoad, (err, result) => {
              let data;
              if (err) return cb(err);
              console.log(`| #7.1p PROCESS - ${gameSet} | : Caching road-map. ${tableNumber}.`);

              data = result || { road: [] };

              if (_.isUndefined(data.road)) {
                _.assign(data, { road: [roadPartial] });
              } else {
                data.road.push(roadPartial);
              }

              CACHE.set(cacheKeyRoad, data, 60 * 60 * 24, (err) => {
                if (err) return cb(err);

                console.log("\033[36m[" + tableNumber + "]", 'INFO: Cached [RoadMap] has been updated.', "\033[0m");
                console.log("\033[36m[" + tableNumber + "]", 'INFO: Data to be added on road map', JSON.stringify(roadPartial), "\033[0m");
                tables[tableNumber].road = data.road;
                return cb();
              });
            });
          },
          // Caching Total Result
          (cb) => {
            CACHE.set(cacheKeyTotal, counter, 60 * 60 * 24, (err) => {
              if (err) return cb(err);

              console.log(`| #7.1p PROCESS - ${gameSet} | : Caching total counts. ${tableNumber}.`);
              tables[tableNumber].totalResult = counter.totalResult;
              return cb();
            });
          },
          // Caching last result for road
          (cb) => {
            CACHE.set(cacheKeyLastRoad, roadPartial, 60 * 60 * 24, (err) => {
              if (err) return cb(err);

              console.log(`| #7.1p PROCESS - ${gameSet} | : Caching partial road-map. ${tableNumber}.`);
              return cb();
            });
          }
        ], cb);
      }]
    };

    async.auto(tasks, (err, taskResult) => {
      if (err) {
        console.log(`| #8 PROCESS - ${gameSet} | : Round processing failed. ${tableNumber}.`);
        console.log(`| #8 PROCESS - ${gameSet} | : ${JSON.stringify(err)}`);
        return cb(err);
      }

      console.log(`| #8 PROCESS - ${gameSet} | : Round processing completed. ${tableNumber}.`);
      return cb(null, taskResult.saveResult);
    });
  },

  /*
  __________                                 __
  \______   \_____   ___.__.  ____   __ __ _/  |_
   |     ___/\__  \ <   |  | /  _ \ |  |  \\   __\
   |    |     / __ \_\___  |(  <_> )|  |  / |  |
   |____|    (____  // ____| \____/ |____/  |__|
                  \/ \/
   */
  payout: (data) => {
    console.log('==============================================================');
    console.log('PAYOUT COMMAND DEPRECATED: This will remove on future release.');
    console.log(JSON.stringify(data));
    console.log('==============================================================');
    // let gameSet, tableNumber, shoeGame, shoeDate, gameType;
    //
    // if (_.isUndefined(data.tableNumber))    return "Invalid Parameter: [data.tableNumber]";
    // if (_.isUndefined(data.data.shoeGame))  return "Invalid Parameter: [data.data.shoeGame]";
    // if (_.isUndefined(data.data.shoeDate))  return "Invalid Parameter: [data.data.shoeDate]";
    // if (_.isUndefined(data.data.gameType))  return "Invalid Parameter: [data.data.gameType]";
    //
    // tableNumber = data.tableNumber;
    // shoeGame = data.data.shoeGame;
    // shoeDate = data.data.shoeDate;
    // gameType = data.data.gameType;
    // gameSet = tables[tableNumber].gameSet;
    //
    // // API Payout Transaction
    // setTimeout( () => {
    //   HTTP.post({
    //     url: ENV.athens + 'transaction/payout',
    //     body: {
    //       shoeHandNumber: shoeGame,
    //       shoeDate: shoeDate,
    //       cacheKey: "result_" + tableNumber,
    //       gameType: gameType,
    //       gameSet: gameSet,
    //       tableNumber: tableNumber
    //     },
    //     json: true
    //   }, (err) => {
    //     if (err) {
    //       console.log("\033[31m[" + tableNumber + "] ===== PAYOUT CALCULATION FAILED ===== : ", "\033[0m");
    //       console.log("\033[31m[" + tableNumber + "] REASON: ", JSON.stringify(err), "]\033[0m");
    //       console.log("\033[31m[" + tableNumber + "] PAYOUT DATA: [", shoeGame, shoeDate, gameType, tableNumber, gameSet, "]\033[0m");
    //     } else {
    //       console.log("\033[33m[" + tableNumber + "] ===== PAYOUT CALCULATION SUCCESS =====", "\033[0m");
    //       console.log("\033[33m[" + tableNumber + "] PAYOUT DATA: [", shoeGame, shoeDate, gameType, tableNumber, gameSet, "]\033[0m");
    //     }
    //   });
    // }, BROADCAST_THROTTLE_MS);
  },

  /*
  __________                    .___ ____   ____.__     .___
  \______   \  ____ _____     __| _/ \   \ /   /|__|  __| _/ ____   ____
   |       _/ /  _ \\__  \   / __ |   \   Y   / |  | / __ |_/ __ \ /  _ \
   |    |   \(  <_> )/ __ \_/ /_/ |    \     /  |  |/ /_/ |\  ___/(  <_> )
   |____|_  / \____/(____  /\____ |     \___/   |__|\____ | \___  >\____/
          \/             \/      \/                      \/     \/
   */
  roadVideo: (data, cb) => {
    // Validators
    if (_.isUndefined(data.tableNumber)) return cb("Invalid Parameter: [data.tableNumber]");
    // No computation just relay the status to players
    console.log("\033[36m[" + data.tableNumber + "] INFO: RoadVideo generated.", "\033[0m");
    // No computation just relay the dealer info to players
    return cb(null, data.data);
  },

  /*
  ________   .__                                                        __
  \______ \  |__|  ______  ____   ____    ____    ____    ____   ____ _/  |_
   |    |  \ |  | /  ___/_/ ___\ /  _ \  /    \  /    \ _/ __ \_/ ___\\   __\
   |    `   \|  | \___ \ \  \___(  <_> )|   |  \|   |  \\  ___/\  \___ |  |
  /_______  /|__|/____  > \___  >\____/ |___|  /|___|  / \___  >\___  >|__|
          \/          \/      \/             \/      \/      \/     \/
   */
  disconnect: (data, cb) => {
    let status, tableNumber;

    // Validators
    if (_.isUndefined(data.tableNumber)) return cb("Invalid Parameter: [data.tableNumber]");
    if (_.isUndefined(data.data.status)) return cb("Invalid Parameter: [data.data.status]");

    status = data.data.status;
    tableNumber = data.tableNumber;

    // No computation just relay the status to players
    console.log("\033[41m\033[30m[" + tableNumber + "] WARNING: Dealer-App has been DISCONNECTED.", "\033[0m");
    // Update global tables
    tables[tableNumber].status = status;


    CACHE.set("CRASHED_" + tableNumber, tables[tableNumber], 60 * 60 * 24,  (err) => {
      if (err) return cb(err);

      console.log("\033[43m\033[30m[" + tableNumber + "] INFO: Table information has been cached due to disconnection.[", tables[tableNumber].gameSet + "@" + tables[tableNumber].shoeGame,"]\033[0m");
      // Return processed data
      return cb(null, data.data);
    });
  }

};

module.exports = services;
