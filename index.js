const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hobi-X Backend API çalışıyor!');
});

app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresinde çalışıyor.`);
});
