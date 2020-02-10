module.exports = {
  serverId: "appServer1",
  port: 12345,
  gameUrl: {
    baccarat: process.env.BACCARAT,
    dragontiger: process.env.DRAGON_TIGER,
    moneywheel: process.env.MONEY_WHEEL
  },
  athensUrl: process.env.ATHENS_URL,
  cache: {
    prefix: "cache:",
    ttl: 7200,
    adapter: "redis",
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    port: process.env.REDIS_PORT,
    db: 19
  }

}
