const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Ortam değişkenlerini yükle
dotenv.config();

// Veritabanı bağlantısı
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API rotaları
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/health-data', require('./routes/healthDataRoutes'));

// Basit test endpoint'i
app.get('/', (req, res) => {
  res.send('API çalışıyor');
});

// Test endpoint'i ekleyin - tanısal amaçlı
app.post('/test-login', (req, res) => {
  res.json({ message: 'Test endpoint çalışıyor!' });
});

// Hata yakalama middleware'leri
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server ${process.env.NODE_ENV} modunda port ${PORT} üzerinde çalışıyor`);
  console.log('Mevcut dosyalar:', require('fs').readdirSync('./routes'));
});