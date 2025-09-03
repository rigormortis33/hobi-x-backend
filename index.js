const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static dosyalar için public klasörünü servis et
app.use('/public', express.static('public'));

// Routes
const gamesRouter = require('./routes/games');
const userRouter = require('./routes/user');

app.use('/api/games', gamesRouter);
app.use('/api/users', userRouter);

// Test endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Hobi-X Backend API çalışıyor! 🎮',
    version: '1.0.0',
    demo: {
      anagram: `http://localhost:${PORT}/public/anagram.html`
    },
    endpoints: {
      games: '/api/games',
      users: '/api/users',
      anagram: {
        getWord: 'GET /api/games/anagram/word?difficulty=easy|medium|hard',
        checkAnswer: 'POST /api/games/anagram/check',
        saveScore: 'POST /api/games/anagram/score'
      }
    }
  });
});

// Hata yakalama middleware
app.use((error, req, res, next) => {
  console.error('API Hatası:', error);
  res.status(500).json({
    success: false,
    message: 'Sunucu hatası oluştu'
  });
});

// 404 middleware
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint bulunamadı'
  });
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`🚀 Hobi-X Backend ${PORT} portunda çalışıyor`);
  console.log(`📱 API URL: http://localhost:${PORT}`);
  console.log(`🎮 Test: http://localhost:${PORT}/api/games`);
});

module.exports = app;
