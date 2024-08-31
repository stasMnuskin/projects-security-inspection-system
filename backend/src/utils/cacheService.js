const cacheManager = require('cache-manager');

const memoryCache = cacheManager.caching({ store: 'memory', max: 100, ttl: 60 * 60 });

module.exports = {
  async get(key) {
    return await memoryCache.get(key);
  },
  async set(key, value, ttl = 60 * 60) {
    await memoryCache.set(key, value, { ttl: ttl });
  },
  async del(key) {
    await memoryCache.del(key);
  },
  async reset() {
    await memoryCache.reset();
  }
};