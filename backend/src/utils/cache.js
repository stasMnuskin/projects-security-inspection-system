const cacheService = require('./cacheService');
const logger = require('./logger');

module.exports = {
  async get(key) {
    try {
      return await cacheService.get(key);
    } catch (error) {
      logger.error('Cache get error:', { error: error.message, stack: error.stack });
      return null;
    }
  },
  async set(key, value, expireIn = 3600) {
    try {
      await cacheService.set(key, value, expireIn);
    } catch (error) {
      logger.error('Cache set error:', { error: error.message, stack: error.stack });
    }
  },
  async del(key) {
    try {
      await cacheService.del(key);
    } catch (error) {
      logger.error('Cache delete error:', { error: error.message, stack: error.stack });
    }
  },
  async reset() {
    try {
      await cacheService.reset();
    } catch (error) {
      logger.error('Cache reset error:', { error: error.message, stack: error.stack });
    }
  }
};