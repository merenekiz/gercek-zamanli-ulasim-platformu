import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { UserRole } from '../types';
import { redisClient } from '../config/database';

interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  private readonly JWT_SECRET: string = process.env.JWT_SECRET || (() => {
    throw new Error('JWT_SECRET environment variable is not set');
  })();
  private readonly JWT_EXPIRE: string = process.env.JWT_EXPIRE || '15m';
  private readonly JWT_REFRESH_EXPIRE: string = process.env.JWT_REFRESH_EXPIRE || '7d';

  /**
   * Kullanıcı kaydı oluşturur
   */
  async register(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }): Promise<{ user: User; tokens: AuthTokens }> {
    // Email kontrolü
    const existingUser = await User.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('Bu email adresi zaten kayıtlı');
    }

    // Email verification token oluştur
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Kullanıcı oluştur
    const user = await User.create({
      ...data,
      emailVerificationToken,
      role: UserRole.USER,
    });

    // TODO: Email verification maili gönder
    // await sendVerificationEmail(user.email, emailVerificationToken);

    // Token'ları oluştur
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  /**
   * Kullanıcı girişi yapar
   */
  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    // Kullanıcıyı bul
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Email veya şifre hatalı');
    }

    // Aktif kontrolü
    if (!user.isActive) {
      throw new Error('Hesabınız devre dışı bırakılmış');
    }

    // Şifre kontrolü
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Email veya şifre hatalı');
    }

    // Son giriş zamanını güncelle
    user.lastLogin = new Date();
    await user.save();

    // Token'ları oluştur
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  /**
   * Access token ve refresh token oluşturur
   */
  async generateTokens(user: User): Promise<AuthTokens> {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    // Access token
    // @ts-ignore - TypeScript strict check issue with jwt.sign
    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRE,
    });

    // Refresh token
    // @ts-ignore - TypeScript strict check issue with jwt.sign
    const refreshToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRE,
    });

    // Refresh token'ı Redis'e kaydet (7 gün)
    await redisClient.setex(
      `refresh_token:${user.id}`,
      7 * 24 * 60 * 60, // 7 gün
      refreshToken
    );

    return { accessToken, refreshToken };
  }

  /**
   * Token'ı doğrular ve payload'ı döndürür
   */
  verifyToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token süresi dolmuş');
      }
      throw new Error('Geçersiz token');
    }
  }

  /**
   * Refresh token kullanarak yeni access token oluşturur
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    // Token'ı doğrula
    const payload = this.verifyToken(refreshToken);

    // Redis'ten kontrol et
    const storedToken = await redisClient.get(`refresh_token:${payload.id}`);
    if (!storedToken || storedToken !== refreshToken) {
      throw new Error('Geçersiz refresh token');
    }

    // Kullanıcıyı bul
    const user = await User.findByPk(payload.id);
    if (!user || !user.isActive) {
      throw new Error('Kullanıcı bulunamadı veya aktif değil');
    }

    // Yeni token'lar oluştur
    const tokens = await this.generateTokens(user);

    return tokens;
  }

  /**
   * Çıkış yapar (refresh token'ı siler)
   */
  async logout(userId: string): Promise<void> {
    await redisClient.del(`refresh_token:${userId}`);
  }

  /**
   * Şifre sıfırlama token'ı oluşturur
   */
  async createPasswordResetToken(email: string): Promise<string> {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Bu email adresine kayıtlı kullanıcı bulunamadı');
    }

    // Reset token oluştur
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Token'ı ve son kullanma tarihini kaydet (1 saat)
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 saat
    await user.save();

    // TODO: Reset email gönder
    // await sendPasswordResetEmail(user.email, resetToken);

    return resetToken;
  }

  /**
   * Şifreyi sıfırlar
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Token'ı hash'le ve kullanıcıyı bul
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken,
      },
    });

    if (!user || !user.passwordResetExpires) {
      throw new Error('Geçersiz veya süresi dolmuş token');
    }

    // Token süresini kontrol et
    if (user.passwordResetExpires < new Date()) {
      throw new Error('Token süresi dolmuş');
    }

    // Şifreyi güncelle
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Tüm refresh token'ları temizle (güvenlik)
    await redisClient.del(`refresh_token:${user.id}`);
  }

  /**
   * Email doğrulama
   */
  async verifyEmail(token: string): Promise<void> {
    const user = await User.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new Error('Geçersiz doğrulama token\'ı');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
  }

  /**
   * Şifre değiştirme
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    // Mevcut şifreyi kontrol et
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error('Mevcut şifre hatalı');
    }

    // Yeni şifreyi kaydet
    user.password = newPassword;
    await user.save();

    // Tüm oturumları sonlandır
    await redisClient.del(`refresh_token:${user.id}`);
  }
}

export default new AuthService();
