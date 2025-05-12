// controllers/userController.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// JWT Token Oluştur
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Kullanıcı kaydı
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Kullanıcı zaten var mı kontrol et
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('Kullanıcı zaten kayıtlı');
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Geçersiz kullanıcı verisi');
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Kullanıcı girişi & token alma
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Email ile kullanıcıyı bul
    const user = await User.findOne({ email });

    // Kullanıcı varsa ve şifre doğruysa
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Geçersiz email veya şifre');
    }
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

// @desc    Kullanıcı profilini al
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
      });
    } else {
      res.status(404);
      throw new Error('Kullanıcı bulunamadı');
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @desc    Kullanıcı profilini güncelle
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      // Şifre güncellenecekse
      if (req.body.password) {
        user.password = req.body.password;
      }

      // Profil bilgilerini güncelle
      if (req.body.profile) {
        user.profile = {
          ...user.profile,
          ...req.body.profile,
        };
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profile: updatedUser.profile,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404);
      throw new Error('Kullanıcı bulunamadı');
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};