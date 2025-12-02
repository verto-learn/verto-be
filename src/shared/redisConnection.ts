import redis from 'redis';
import config from '../config/config';

export const testRedisConnection = async () => {
  try {
    const client = redis.createClient({
      socket: {
        host: config.redisHost,
        port: config.redisPort,
      },
      username: config.redisUsername,
      password: config.redisPassword,
      database: config.redisDb,
    });

    await client.connect();
    const pong = await client.ping();
    await client.disconnect();
    
    return { connected: true, response: pong };
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};