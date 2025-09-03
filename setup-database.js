const { pool } = require('./config/db');

/**
 * Veritabanı tablolarını oluşturur
 */
async function createTables() {
  try {
    console.log('🗄️ Veritabanı tabloları oluşturuluyor...\n');

    // Kullanıcılar tablosu
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        total_score INT DEFAULT 0,
        games_played INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users tablosu oluşturuldu');

    // Oyunlar tablosu
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        difficulty_levels JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Games tablosu oluşturuldu');

    // Anagram kelimeleri tablosu
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS anagram_words (
        id INT AUTO_INCREMENT PRIMARY KEY,
        word VARCHAR(50) NOT NULL,
        hint VARCHAR(200),
        category VARCHAR(50),
        difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Anagram Words tablosu oluşturuldu');

    // Oyun skorları tablosu
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS game_scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        game_id INT NOT NULL,
        score INT NOT NULL,
        level VARCHAR(20),
        time_spent INT, -- saniye cinsinden
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Game Scores tablosu oluşturuldu');

    console.log('\n🎉 Tüm tablolar başarıyla oluşturuldu!');

  } catch (error) {
    console.error('❌ Tablo oluşturma hatası:', error.message);
    throw error;
  }
}

/**
 * Başlangıç verilerini ekler
 */
async function seedData() {
  try {
    console.log('\n🌱 Başlangıç verileri ekleniyor...\n');

    // Anagram oyununu ekle
    const [gameExists] = await pool.execute(
      'SELECT id FROM games WHERE name = ?', 
      ['Anagram']
    );

    let gameId;
    if (gameExists.length === 0) {
      const [result] = await pool.execute(`
        INSERT INTO games (name, description, category, difficulty_levels) 
        VALUES (?, ?, ?, ?)
      `, [
        'Anagram',
        'Kelimelerin harflerini karıştırıp doğru kelimeyi bulma oyunu',
        'kelime',
        JSON.stringify(['easy', 'medium', 'hard'])
      ]);
      gameId = result.insertId;
      console.log('✅ Anagram oyunu eklendi');
    } else {
      gameId = gameExists[0].id;
      console.log('ℹ️ Anagram oyunu zaten mevcut');
    }

    // Anagram kelimeleri ekle
    const anagramWords = [
      // Kolay seviye
      { word: 'KEDI', hint: 'Miyavlayan hayvan', category: 'hayvan', difficulty: 'easy' },
      { word: 'ARABA', hint: 'Ulaşım aracı', category: 'nesne', difficulty: 'easy' },
      { word: 'MASA', hint: 'Üzerinde yemek yediğimiz', category: 'mobilya', difficulty: 'easy' },
      { word: 'GÜNEŞ', hint: 'Gündüz ışık veren', category: 'doğa', difficulty: 'easy' },
      { word: 'KITAP', hint: 'Okumak için kullanılan', category: 'nesne', difficulty: 'easy' },
      
      // Orta seviye
      { word: 'BİLGİSAYAR', hint: 'Elektronik hesaplama makinesi', category: 'teknoloji', difficulty: 'medium' },
      { word: 'UÇAK', hint: 'Havada uçan araç', category: 'ulaşım', difficulty: 'medium' },
      { word: 'MÜHENDİS', hint: 'Teknik işlerle uğraşan meslek', category: 'meslek', difficulty: 'medium' },
      { word: 'TELEFON', hint: 'Uzaktan konuşmaya yarayan', category: 'teknoloji', difficulty: 'medium' },
      { word: 'DOKTOR', hint: 'Hastaları tedavi eden', category: 'meslek', difficulty: 'medium' },
      
      // Zor seviye
      { word: 'ÜNİVERSİTE', hint: 'Yükseköğretim kurumu', category: 'eğitim', difficulty: 'hard' },
      { word: 'ECZANE', hint: 'İlaç satılan yer', category: 'mekan', difficulty: 'hard' },
      { word: 'HASTANE', hint: 'Hastaların tedavi edildiği yer', category: 'mekan', difficulty: 'hard' },
      { word: 'KÜTÜPHANE', hint: 'Kitapların bulunduğu yer', category: 'mekan', difficulty: 'hard' },
      { word: 'PAZARTESI', hint: 'Haftanın ikinci günü', category: 'zaman', difficulty: 'hard' }
    ];

    for (const wordData of anagramWords) {
      const [exists] = await pool.execute(
        'SELECT id FROM anagram_words WHERE word = ?', 
        [wordData.word]
      );
      
      if (exists.length === 0) {
        await pool.execute(
          'INSERT INTO anagram_words (word, hint, category, difficulty) VALUES (?, ?, ?, ?)',
          [wordData.word, wordData.hint, wordData.category, wordData.difficulty]
        );
      }
    }

    console.log('✅ Anagram kelimeleri eklendi');
    console.log('\n🎉 Başlangıç verileri başarıyla eklendi!');

  } catch (error) {
    console.error('❌ Veri ekleme hatası:', error.message);
    throw error;
  }
}

/**
 * Tüm kurulum işlemlerini çalıştır
 */
async function setupDatabase() {
  try {
    await createTables();
    await seedData();
    console.log('\n🚀 Veritabanı kurulumu tamamlandı!');
  } catch (error) {
    console.error('💥 Kurulum hatası:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Eğer dosya doğrudan çalıştırılıyorsa kurulumu başlat
if (require.main === module) {
  setupDatabase();
}

module.exports = { createTables, seedData, setupDatabase };
