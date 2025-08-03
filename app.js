const express = require('express');
const app = express();
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { createClient } = require('redis');

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

const fakeDB = () =>
  new Promise((res) => {
    setTimeout(() => {
      console.log('Fetching from DB');
      res({ id: 1, name: 'Alice' });
    }, 1000);
  });

app.get('/user', async (req, res) => {
  const data = await fakeDB();
  res.json(data);
});

app.listen(3001, () => {
  console.log('Server is running on http://localhost:3001');
});
