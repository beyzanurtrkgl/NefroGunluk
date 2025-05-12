// models/healthDataModel.js
const mongoose = require('mongoose');

const healthDataSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    waterIntake: {
      type: Number, // Litre cinsinden
      required: true,
    },
    bathroomVisits: {
      type: Number, // Tuvalet ziyareti sayısı
      required: true,
      default: 0
    },
    stressLevel: {
      type: Number, // 1-10 arası stres seviyesi
      required: true,
      min: 1,
      max: 10,
      default: 1
    },
    urineColor: {
      type: String,
      enum: ['açık sarı', 'sarı', 'koyu sarı', 'kırmızımsı'],
      required: true,
    },
    dialysis: {
      type: Boolean,
      default: false,
    },
    bloodPressure: {
      systolic: { type: Number }, // Büyük tansiyon
      diastolic: { type: Number }, // Küçük tansiyon
    },
    // İsteğe bağlı genişletilebilir alanlar
    weight: { type: Number }, // kg
    medications: [
      {
        name: { type: String },
        dosage: { type: String },
        taken: { type: Boolean, default: false },
      },
    ],
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Bir kullanıcının bir gün için yalnızca bir sağlık verisi kaydı olabilir
healthDataSchema.index({ user: 1, date: 1 }, { unique: true });

const HealthData = mongoose.model('HealthData', healthDataSchema);

module.exports = HealthData;