import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // 5 deneme
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Çok fazla deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Başarılı istekleri sayma
});

const generalAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.',
    },
  },
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Kullanıcı kaydı
 * @access  Public
 */
router.post('/register', authLimiter, authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Kullanıcı girişi
 * @access  Public
 */
router.post('/login', authLimiter, authController.login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Access token yenileme
 * @access  Public
 */
router.post('/refresh', generalAuthLimiter, authController.refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Çıkış
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Şifre sıfırlama talebi
 * @access  Public
 */
router.post('/forgot-password', generalAuthLimiter, authController.forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Şifre sıfırlama
 * @access  Public
 */
router.post('/reset-password', generalAuthLimiter, authController.resetPassword);

/**
 * @route   GET /api/v1/auth/verify-email/:token
 * @desc    Email doğrulama
 * @access  Public
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Şifre değiştirme
 * @access  Private
 */
router.post('/change-password', authenticate, authController.changePassword);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Mevcut kullanıcı bilgilerini getir
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

export default router;
