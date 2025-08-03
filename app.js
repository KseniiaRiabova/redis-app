const express = require('express');
const app = express();
// const rateLimit = res;

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

app.listen(3001, () =>
  console.log('Server is running on http://localhost:3001')
);
