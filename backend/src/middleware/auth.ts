import { Response, NextFunction } from 'express';
import authService from '../services/authService';
import { AuthenticatedRequest, UserRole } from '../types';
import { AppError } from './errorHandler';

/**
 * JWT token doğrulama middleware
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Authorization header'ını kontrol et
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Kimlik doğrulama gerekli. Token bulunamadı.', 401);
    }

    // Token'ı al
    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Kimlik doğrulama gerekli. Token bulunamadı.', 401);
    }

    // Token'ı doğrula
    const payload = authService.verifyToken(token);

    // User bilgilerini request'e ekle
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Geçersiz veya süresi dolmuş token', 401));
    }
  }
};

/**
 * Role kontrolü yapan middleware factory
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Kimlik doğrulama gerekli', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        'Bu işlem için yetkiniz yok',
        403
      );
    }

    next();
  };
};

/**
 * Optional authentication - Token varsa doğrula, yoksa devam et
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      if (token) {
        try {
          const payload = authService.verifyToken(token);
          req.user = {
            id: payload.id,
            email: payload.email,
            role: payload.role,
          };
        } catch (error) {
          // Token geçersiz ama optional olduğu için devam et
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
