const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Kullanıcı kaydı
router.post('/', registerUser);

// Kullanıcı girişi
router.post('/login', loginUser);

// Kullanıcı profili işlemleri
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;