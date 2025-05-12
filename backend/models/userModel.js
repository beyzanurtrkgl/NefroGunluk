// models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lütfen isim giriniz'],
    },
    email: {
      type: String,
      required: [true, 'Lütfen email giriniz'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Lütfen şifre giriniz'],
      minlength: 6,
    },
    profile: {
      age: { type: Number },
      gender: { type: String, enum: ['Erkek', 'Kadın', 'Diğer'] },
      diseaseStartDate: { type: Date },
      height: { type: Number }, // cm
      weight: { type: Number }, // kg
    },
  },
  {
    timestamps: true,
  }
);

// Şifreyi hashleme
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Şifre kontrolü
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;