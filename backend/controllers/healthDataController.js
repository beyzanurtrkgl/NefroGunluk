// controllers/healthDataController.js
const HealthData = require('../models/healthDataModel');

// @desc    Sağlık verisi ekle veya güncelle
// @route   POST /api/health-data
// @access  Private
const createOrUpdateHealthData = async (req, res) => {
  try {
    const { 
      date, 
      waterIntake, 
      bathroomVisits,
      stressLevel,
      urineColor, 
      dialysis,
      bloodPressure, 
      weight, 
      medications, 
      notes 
    } = req.body;

    // Tarih formatını düzenle (sadece yıl, ay, gün)
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);

    // O kullanıcı için o güne ait bir veri var mı kontrol et
    let healthData = await HealthData.findOne({
      user: req.user._id,
      date: {
        $gte: formattedDate,
        $lt: new Date(formattedDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    // Varsa güncelle, yoksa yeni oluştur
    if (healthData) {
      healthData.waterIntake = waterIntake !== undefined ? waterIntake : healthData.waterIntake;
      healthData.bathroomVisits = bathroomVisits !== undefined ? bathroomVisits : healthData.bathroomVisits;
      healthData.stressLevel = stressLevel !== undefined ? stressLevel : healthData.stressLevel;
      healthData.urineColor = urineColor || healthData.urineColor;
      healthData.dialysis = dialysis !== undefined ? dialysis : healthData.dialysis;
      
      // İsteğe bağlı alanları güncelle
      if (bloodPressure) healthData.bloodPressure = bloodPressure;
      if (weight !== undefined) healthData.weight = weight;
      if (medications) healthData.medications = medications;
      if (notes) healthData.notes = notes;

      await healthData.save();
    } else {
      healthData = await HealthData.create({
        user: req.user._id,
        date: formattedDate,
        waterIntake,
        bathroomVisits,
        stressLevel,
        urineColor,
        dialysis,
        bloodPressure,
        weight,
        medications,
        notes,
      });
    }

    res.status(201).json(healthData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Günlük sağlık verisini al
// @route   GET /api/health-data/daily/:date
// @access  Private
const getDailyHealthData = async (req, res) => {
  try {
    const requestedDate = new Date(req.params.date);
    requestedDate.setHours(0, 0, 0, 0);

    const healthData = await HealthData.findOne({
      user: req.user._id,
      date: {
        $gte: requestedDate,
        $lt: new Date(requestedDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (healthData) {
      res.json(healthData);
    } else {
      res.status(404).json({ message: 'Bu gün için veri bulunamadı' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Belirli tarih aralığındaki sağlık verilerini al
// @route   GET /api/health-data/range
// @access  Private
const getHealthDataRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const healthData = await HealthData.find({
      user: req.user._id,
      date: {
        $gte: start,
        $lte: end,
      },
    }).sort({ date: 1 });

    res.json(healthData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Sağlık verilerinin özetini al (su tüketimi ortalaması, idrar rengi dağılımı vb.)
// @route   GET /api/health-data/summary
// @access  Private
const getHealthDataSummary = async (req, res) => {
  try {
    const { period } = req.query; // daily, weekly, monthly
    
    let startDate;
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    if (period === 'weekly') {
      // Son 7 gün
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
      // Son 30 gün
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Varsayılan: günlük (son 24 saat)
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
    }

    // Verileri al
    const healthData = await HealthData.find({
      user: req.user._id,
      date: {
        $gte: startDate,
        $lte: now,
      },
    }).sort({ date: 1 });

    // Özet hesaplamalarını yap
    const summary = {
      waterIntakeAvg: 0,
      bathroomVisitsAvg: 0,
      stressLevelAvg: 0,
      urineColorDistribution: {
        'açık sarı': 0,
        'sarı': 0,
        'koyu sarı': 0,
        'kırmızımsı': 0,
      },
      dialysisCount: 0,
      bloodPressureAvg: {
        systolic: 0,
        diastolic: 0
      },
      recordsCount: healthData.length,
      period,
      startDate,
      endDate: now
    };

    // Ortalama hesaplamaları
    if (healthData.length > 0) {
      // Su tüketimi ortalaması
      const totalWaterIntake = healthData.reduce((sum, data) => sum + data.waterIntake, 0);
      summary.waterIntakeAvg = totalWaterIntake / healthData.length;
      
      // Tuvalet ziyareti ortalaması
      const totalBathroomVisits = healthData.reduce((sum, data) => sum + data.bathroomVisits, 0);
      summary.bathroomVisitsAvg = totalBathroomVisits / healthData.length;
      
      // Stres seviyesi ortalaması
      const totalStressLevel = healthData.reduce((sum, data) => sum + data.stressLevel, 0);
      summary.stressLevelAvg = totalStressLevel / healthData.length;
      
      // İdrar rengi dağılımı
      healthData.forEach(data => {
        if (data.urineColor) {
          summary.urineColorDistribution[data.urineColor]++;
        }
      });
      
      // Diyaliz sayısı
      summary.dialysisCount = healthData.filter(data => data.dialysis).length;
      
      // Tansiyon ortalaması
      let bpCount = 0;
      let totalSystolic = 0;
      let totalDiastolic = 0;
      
      healthData.forEach(data => {
        if (data.bloodPressure && data.bloodPressure.systolic && data.bloodPressure.diastolic) {
          totalSystolic += data.bloodPressure.systolic;
          totalDiastolic += data.bloodPressure.diastolic;
          bpCount++;
        }
      });
      
      if (bpCount > 0) {
        summary.bloodPressureAvg.systolic = totalSystolic / bpCount;
        summary.bloodPressureAvg.diastolic = totalDiastolic / bpCount;
      }
    }

    res.json(summary);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createOrUpdateHealthData,
  getDailyHealthData,
  getHealthDataRange,
  getHealthDataSummary,
};