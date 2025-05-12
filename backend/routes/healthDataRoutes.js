// routes/healthDataRoutes.js
const express = require('express');
const router = express.Router();
const {
  createOrUpdateHealthData,
  getDailyHealthData,
  getHealthDataRange,
  getHealthDataSummary,
} = require('../controllers/healthDataController');
const { protect } = require('../middleware/authMiddleware');

// Tüm rotalar için authentication gerekli
router.use(protect);

// Sağlık verisi ekle/güncelle
router.post('/', createOrUpdateHealthData);

// Günlük sağlık verisi al
router.get('/daily/:date', getDailyHealthData);

// Belirli tarih aralığındaki sağlık verilerini al
router.get('/range', getHealthDataRange);

// Sağlık verilerinin özetini al
router.get('/summary', getHealthDataSummary);

module.exports = router;