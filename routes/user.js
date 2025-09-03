const express = require('express');
const router = express.Router();

// Kullanıcı kaydı
router.post('/register', (req, res) => {
  res.json({ message: 'Kullanıcı kaydı başarılı!' });
});

// Kullanıcı girişi
router.post('/login', (req, res) => {
  res.json({ message: 'Giriş başarılı!' });
});

module.exports = router;
