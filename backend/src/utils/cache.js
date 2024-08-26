const Redis = require('ioredis');
const logger = require('./logger');

let client;

if (process.env.NODE_ENV !== 'test') {
  client = new Redis({
    host: process.env.DB_HOST,
    port: process.env.REDIS_PORT
  });
}

module.exports = {
  get: async (key) => {
    if (process.env.NODE_ENV === 'test') return null;
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', { error: error.message, stack: error.stack });
      return null;
    }
  },
  set: async (key, value, expireIn = 3600) => {
    if (process.env.NODE_ENV === 'test') return;
    try {
      await client.set(key, JSON.stringify(value), 'EX', expireIn);
    } catch (error) {
      logger.error('Redis set error:', { error: error.message, stack: error.stack });
    }
  },
  client
};