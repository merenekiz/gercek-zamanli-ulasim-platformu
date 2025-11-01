import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import { ApiResponse, AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

/**
 * Kullanıcı kaydı
 * POST /api/v1/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name, phone } = req.body;

    // Validation
    if (!email || !password || !name) {
      throw new AppError('Email, şifre ve isim zorunludur', 400);
    }

    if (password.length < 8) {
      throw new AppError('Şifre en az 8 karakter olmalıdır', 400);
    }

    // Kayıt işlemi
    const { user, tokens } = await authService.register({
      email,
      password,
      name,
      phone,
    });

    const response: ApiResponse = {
      success: true,
      data: {
        user: user.toJSON(),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Kullanıcı girişi
 * POST /api/v1/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      throw new AppError('Email ve şifre zorunludur', 400);
    }

    // Giriş işlemi
    const { user, tokens } = await authService.login(email, password);

    const response: ApiResponse = {
      success: true,
      data: {
        user: user.toJSON(),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Token yenileme
 * POST /api/v1/auth/refresh
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      throw new AppError('Refresh token zorunludur', 400);
    }

    const tokens = await authService.refreshAccessToken(token);

    const response: ApiResponse = {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Çıkış
 * POST /api/v1/auth/logout
 */
export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Kimlik doğrulama gerekli', 401);
    }

    await authService.logout(req.user.id);

    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Başarıyla çıkış yapıldı',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Şifre sıfırlama talebi
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email zorunludur', 400);
    }

    await authService.createPasswordResetToken(email);

    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Şifre sıfırlama bağlantısı email adresinize gönderildi',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Şifre sıfırlama
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      throw new AppError('Token ve yeni şifre zorunludur', 400);
    }

    if (password.length < 8) {
      throw new AppError('Şifre en az 8 karakter olmalıdır', 400);
    }

    await authService.resetPassword(token, password);

    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Şifreniz başarıyla sıfırlandı',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Email doğrulama
 * GET /api/v1/auth/verify-email/:token
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      throw new AppError('Token zorunludur', 400);
    }

    await authService.verifyEmail(token);

    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Email adresiniz başarıyla doğrulandı',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Şifre değiştirme
 * POST /api/v1/auth/change-password
 */
export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Kimlik doğrulama gerekli', 401);
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Mevcut şifre ve yeni şifre zorunludur', 400);
    }

    if (newPassword.length < 8) {
      throw new AppError('Yeni şifre en az 8 karakter olmalıdır', 400);
    }

    await authService.changePassword(req.user.id, currentPassword, newPassword);

    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Şifreniz başarıyla değiştirildi',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Mevcut kullanıcı bilgilerini getir
 * GET /api/v1/auth/me
 */
export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Kimlik doğrulama gerekli', 401);
    }

    // Kullanıcıyı veritabanından çek (güncel bilgiler için)
    const User = (await import('../models/User')).default;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      throw new AppError('Kullanıcı bulunamadı', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        user: user.toJSON(),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
