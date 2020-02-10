const FUNCTION = require("../helpers/function");
const tableNumber = "P8";

let ai = {
  roulette: () => {
    let shoe = 0;
    let funcType = 0;
    let timer = 25;
    let action = [
      // Set ShoeHand
      () => {
        FUNCTION.broadcastToPlayers({ tables: { [tableNumber]: { shoeGame: shoe++ }}});
      },
      // Set Betting Status
      () => {
        FUNCTION.broadcastToPlayers({ tables: { [tableNumber]: { status: "betting" }}});
        console.log("Status: BETTING");
      },

      // Set Timer
      () => {
        FUNCTION.broadcastToPlayers({ tables: { [tableNumber]: { game: { timer: timer } } } } );
        console.log("Timer:", timer);
      },

      () => {
        FUNCTION.broadcastToPlayers({ tables: { [tableNumber]: { status: "dealing" } } } );
        console.log("Status: DEALING");
      },

      () => {
        FUNCTION.broadcastToPlayers({ tables: { [tableNumber]: { status: "dealing" } } } );
        console.log("Status: DEALING");
      }
    ];


    _.assign(tables, {});

    setInterval(() => {

      switch (funcType) {
        // SET SHOE HAND
        case 0:
          action[0]();
          funcType++;
          break;

        // BETTING START
        case 1:
          action[1]();
          funcType++;
          break;

        // TIMER 0 - 25
        case 2:
          action[2]();
          if (timer <= 0 ) {
            funcType++;
            timer = 25
          } else {
            timer--
          }
          break;

        // DEALING
        case 3:
          action[3]();
          funcType++;
          break;

        default:
          funcType = 0;
          break;
      }

    }, 1000);
  }


};

module.exports = ai;
