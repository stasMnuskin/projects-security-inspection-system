let client;

if (process.env.NODE_ENV !== 'test') {
  const Redis = require('ioredis');
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
      console.error('Redis get error:', error);
      return null;
    }
  },
  set: async (key, value, expireIn = 3600) => {
    if (process.env.NODE_ENV === 'test') return;
    try {
      await client.set(key, JSON.stringify(value), 'EX', expireIn);
    } catch (error) {
      console.error('Redis set error:', error);
    }
  },
  client
};