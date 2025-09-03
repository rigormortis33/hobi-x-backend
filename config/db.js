const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Önce kök .env (app.js zaten çağırıyor olabilir), ardından server/.env yüklemeyi dene
dotenv.config();
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Ortam değişkenleri
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || '';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || '';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_CONN_LIMIT = Number(process.env.DB_CONN_LIMIT || 10);

// Veritabanı konfigürasyonu
const dbConfig = {
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: DB_CONN_LIMIT,
  queueLimit: 0,
  charset: 'utf8mb4'
};

console.log('Veritabanı bağlantı bilgileri:');
console.log('Host:', dbConfig.host);
console.log('Kullanıcı:', dbConfig.user ? '[AYARLI]' : '[BOŞ]');
console.log('Veritabanı:', dbConfig.database || '[BOŞ]');

// Bağlantı havuzu oluştur
const pool = mysql.createPool(dbConfig);

/**
 * Veritabanı bağlantısını test eder
 * @returns {Promise<boolean>} Bağlantı başarılı ise true, değilse false
 */
async function testConnection() {
  try {
    console.log('Veritabanına bağlanılıyor...');
    
    const connection = await pool.getConnection();
    console.log('✓ Veritabanı bağlantısı başarılı!');
    
    // Veritabanı versiyonunu al
    const [rows] = await connection.query('SELECT VERSION() as version');
    console.log('✓ MySQL Versiyonu:', rows[0].version);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ Veritabanı bağlantı hatası:');
    console.error('  → Hata mesajı:', error.message);
    
    if (error.message.includes('Access denied')) {
      console.error('  → Kullanıcı adı veya şifre yanlış olabilir');
      console.error('  → VEYA IP adresi MySQL sunucusunda izinli değil');
      console.error('  → Hostinger kontrol panelinden "Uzak MySQL" bölümüne');
      console.error(`     IP adresinizi (${error.message.match(/'[^']*'@'([^']*)'/) ? error.message.match(/'[^']*'@'([^']*)'/).pop() : 'bilinmeyen'}) eklemeyi deneyin`);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.error('  → MySQL sunucu adresi yanlış veya sunucu çalışmıyor');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('  → MySQL sunucusu bağlantıyı reddetti');
    }
    
    console.error('  → Hata kodu:', error.code);
    console.error('  → Hata numarası:', error.errno);
    return false;
  }
}

/**
 * Bağlantı havuzu örneğini ve test fonksiyonunu dışa aktar
 */
module.exports = { 
  pool, 
  testConnection,
  dbConfig
};
