console.log('🔍 Veritabanı bağlantı testi başlatılıyor...\n');

require('dotenv').config();
const { testConnection } = require('./config/db');

testConnection().then((result) => {
  if (result) {
    console.log('\n✅ Başarılı! Veritabanı bağlantısı çalışıyor.');
  } else {
    console.log('\n❌ Başarısız! Veritabanı bağlantısı kurulamadı.');
  }
}).catch((error) => {
  console.error('\n💥 Beklenmeyen hata:', error.message);
});
