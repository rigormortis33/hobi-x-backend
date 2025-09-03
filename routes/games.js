const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

/**
 * Tüm oyunları listele
 * GET /api/games
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, name, description, category, difficulty_levels 
      FROM games
    `);
    
    // JSON stringlerini parse et
    const games = rows.map(game => ({
      ...game,
      difficulty_levels: JSON.parse(game.difficulty_levels)
    }));
    
    res.json({
      success: true,
      games: games
    });
  } catch (error) {
    console.error('Oyunları getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Oyunlar yüklenirken hata oluştu'
    });
  }
});

/**
 * Anagram oyunu için rastgele kelime getir
 * GET /api/games/anagram/word?difficulty=easy|medium|hard
 */
router.get('/anagram/word', async (req, res) => {
  try {
    const { difficulty = 'medium' } = req.query;
    
    // Geçerli zorluk seviyeleri
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli zorluk seviyeleri: easy, medium, hard'
      });
    }
    
    // Rastgele kelime getir
    const [rows] = await pool.execute(`
      SELECT id, word, hint, category, difficulty 
      FROM anagram_words 
      WHERE difficulty = ? 
      ORDER BY RAND() 
      LIMIT 1
    `, [difficulty]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bu zorluk seviyesinde kelime bulunamadı'
      });
    }
    
    const wordData = rows[0];
    
    // Kelimenin harflerini karıştır
    const scrambledWord = scrambleWord(wordData.word);
    
    res.json({
      success: true,
      data: {
        id: wordData.id,
        scrambledWord: scrambledWord,
        originalWord: wordData.word, // Debug için, production'da kaldır
        hint: wordData.hint,
        category: wordData.category,
        difficulty: wordData.difficulty,
        wordLength: wordData.word.length
      }
    });
    
  } catch (error) {
    console.error('Anagram kelime getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kelime getirilirken hata oluştu'
    });
  }
});

/**
 * Anagram cevabını kontrol et
 * POST /api/games/anagram/check
 */
router.post('/anagram/check', async (req, res) => {
  try {
    const { wordId, userAnswer, timeSpent } = req.body;
    
    if (!wordId || !userAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Kelime ID ve cevap gerekli'
      });
    }
    
    // Doğru cevabı getir
    const [rows] = await pool.execute(
      'SELECT word FROM anagram_words WHERE id = ?',
      [wordId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kelime bulunamadı'
      });
    }
    
    const correctAnswer = rows[0].word.toUpperCase();
    const userAnswerUpper = userAnswer.toUpperCase();
    const isCorrect = correctAnswer === userAnswerUpper;
    
    // Skor hesapla
    let score = 0;
    if (isCorrect) {
      const baseScore = correctAnswer.length * 10;
      const timeBonus = Math.max(0, 60 - (timeSpent || 0)) * 2; // Hız bonusu
      score = baseScore + timeBonus;
    }
    
    res.json({
      success: true,
      data: {
        isCorrect,
        correctAnswer,
        userAnswer: userAnswerUpper,
        score,
        timeSpent: timeSpent || 0
      }
    });
    
  } catch (error) {
    console.error('Anagram cevap kontrolü hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Cevap kontrol edilirken hata oluştu'
    });
  }
});

/**
 * Anagram skor kaydet
 * POST /api/games/anagram/score
 */
router.post('/anagram/score', async (req, res) => {
  try {
    const { userId, score, difficulty, timeSpent } = req.body;
    
    if (!userId || score === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID ve skor gerekli'
      });
    }
    
    // Anagram oyun ID'sini getir
    const [gameRows] = await pool.execute(
      'SELECT id FROM games WHERE name = ?',
      ['Anagram']
    );
    
    if (gameRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Anagram oyunu bulunamadı'
      });
    }
    
    const gameId = gameRows[0].id;
    
    // Skoru kaydet
    await pool.execute(`
      INSERT INTO game_scores (user_id, game_id, score, level, time_spent) 
      VALUES (?, ?, ?, ?, ?)
    `, [userId, gameId, score, difficulty, timeSpent]);
    
    // Kullanıcının toplam skorunu güncelle
    await pool.execute(`
      UPDATE users 
      SET total_score = total_score + ?, games_played = games_played + 1 
      WHERE id = ?
    `, [score, userId]);
    
    res.json({
      success: true,
      message: 'Skor başarıyla kaydedildi',
      data: { score, difficulty }
    });
    
  } catch (error) {
    console.error('Skor kaydetme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Skor kaydedilirken hata oluştu'
    });
  }
});

/**
 * Kelimeyi karıştır
 */
function scrambleWord(word) {
  const letters = word.split('');
  
  // Fisher-Yates karıştırma algoritması
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  
  // Eğer karıştırılmış kelime orijinal ile aynıysa tekrar karıştır
  const scrambled = letters.join('');
  if (scrambled === word && word.length > 1) {
    return scrambleWord(word);
  }
  
  return scrambled;
}

module.exports = router;
