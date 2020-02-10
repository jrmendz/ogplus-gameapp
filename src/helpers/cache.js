const Memori = require("memori");
const cache = new Memori(connConfigs.cache);

module.exports = {
  /**
   * Add cache
   * @param key
   * @param value
   * @param ttl
   * @param done
   */
  set: (key, value, ttl, done) => {
    cache.set(key, value, ttl, (err, result) => {
      if(err) {
        console.log(new Error(err));
        return done(err);
      }
      return done(null, result);
    });
  },


  get: (key, done) => {
    cache.get(key, (err, result) => {
      if(err) {
        console.log(new Error(err));
        return done(err);
      }
      return done(null, result);
    });
  },

  /**
   * Delete cache key
   * @param key
   * @param done
   */
  delete: (key, done) => {
    cache.del(key, (err, result) => {
      if(err) {
        console.log(new Error(err));
        return done(err);
      }
      return done(null, result);
    });
  },
};
