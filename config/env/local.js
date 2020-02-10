module.exports = {
  connections: {
    adapter: 'mysql',
    host: '172.16.126.116',
    port: '3306',
    user: 'panda_dev', // optional
    password: 'Panda@123456', // optional
    database: 'panda_dev', //optional
  },
  cache: {
    prefix: "cache:",
    ttl: 7200,
    adapter: "redis",
    host: "172.16.126.116",
    password: "",
    port: 6379,
    db: 0 // Should not be the same DB number on Game Server but same with Athens Cache Port number
  },
  athens: 'http://localhost:8001/',
  serverId: "appServerOGPlusMonitoring",
  port: 12345,
  crashPort: 6969,
  cmdKey: [ { key: 'df525c4b6d094937cb020ba1644d9224', server: 'athens' } ],
  gameUrl: {
    baccarat: "ws://aquarius.oriental-game.com:12321/qmpOM2xAJ6/appServerOGPlusMonitoring",
    dragontiger: "ws://aquarius.oriental-game.com:12322/qmpOM2xAJ6/appServerOGPlusMonitoring",
    moneywheel: "ws://aquarius.oriental-game.com:12323/qmpOM2xAJ6/appServerOGPlusMonitoring",
    roulette: "wss://aquarius.oriental-game.com:7001/roulette",
    all: "wss://uranus.oriental-game.com:12345/casino/"
  }
};
