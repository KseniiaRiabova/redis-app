const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  const express = require('express');
  const { createClient } = require('redis');
  const rateLimit = require('express-rate-limit');
  const { RedisStore } = require('rate-limit-redis');

  const app = express();
  const redisClient = createClient();
  redisClient.connect().catch(console.error);

  const limiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
    }),
    windowMs: 60 * 1000, // 1 minute
    max: 5, // liming each IP to 5 requests per windowMs
    message: 'Too many requests, please try again later.',
  });

  app.use(limiter);

  const fakeDB = () =>
    new Promise((res) => {
      setTimeout(() => {
        console.log('Fetching from DB');
        res({ id: 1, name: 'Ksusha' });
      }, 1000);
    });

  app.get('/user', async (req, res) => {
    const cacheKey = 'user:1';
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      console.log('Returning from cache');
      res.set('Cache-Control', 'public, max-age=60');
      return res.json(JSON.parse(cached));
    }
    const data = await fakeDB();
    await redisClient.set(cacheKey, JSON.stringify(data), 'EX', 60);
    res.json(data);
  });

  app.listen(3001, () => {
    console.log('Server is running on http://localhost:3001');
  });
}
