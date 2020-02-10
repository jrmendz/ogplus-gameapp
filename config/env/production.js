module.exports = {
  connections: {
    adapter: 'mysql',
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
  },
  cache: {
    prefix: "cache_og:",
    ttl: 7200,
    adapter: "redis",
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    port: process.env.REDIS_PORT,
    db: 19 // Should not be the same DB number on Game Server but same with Athens Cache Port number
  },
  athens: process.env.ATHENS_URL,
  serverId: "appServerProd",
  port: 12345,
  crashPort: 6969,
  cmdKey: [ { key: 'df525c4b6d094937cb020ba1644d9224', server: 'athens' } ], // Command Key Format: [ { "key": "YOUR_KEY", "server": "SERVER_NAME"} ]
  gameUrl: {
    baccarat: "ws://aquarius.oriental-game.com:12321/qmpOM2xAJ7/appServerProd",
    dragontiger: "ws://aquarius.oriental-game.com:12322/qmpOM2xAJ7/appServerProd",
    moneywheel: "ws://aquarius.oriental-game.com:12323/qmpOM2xAJ7/appServerProd",
    roulette: "wss://aquarius.oriental-game.com:7001/roulette"
  }
};
