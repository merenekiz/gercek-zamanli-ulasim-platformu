import { z } from 'zod';

/**
 * Login Form Validation Schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-posta adresi zorunludur')
    .email('Geçerli bir e-posta adresi giriniz'),
  password: z
    .string()
    .min(1, 'Şifre zorunludur')
    .min(8, 'Şifre en az 8 karakter olmalıdır'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Register Form Validation Schema
 */
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Ad Soyad zorunludur')
      .min(2, 'Ad Soyad en az 2 karakter olmalıdır')
      .max(100, 'Ad Soyad en fazla 100 karakter olabilir')
      .regex(
        /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/,
        'Ad Soyad sadece harf ve boşluk içerebilir'
      ),
    email: z
      .string()
      .min(1, 'E-posta adresi zorunludur')
      .email('Geçerli bir e-posta adresi giriniz'),
    password: z
      .string()
      .min(1, 'Şifre zorunludur')
      .min(8, 'Şifre en az 8 karakter olmalıdır')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'
      ),
    confirmPassword: z.string().min(1, 'Şifre tekrarı zorunludur'),
    terms: z
      .boolean()
      .refine((val) => val === true, {
        message: 'Kullanım koşullarını kabul etmelisiniz',
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Password Reset Request Schema
 */
export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .min(1, 'E-posta adresi zorunludur')
    .email('Geçerli bir e-posta adresi giriniz'),
});

export type PasswordResetRequestData = z.infer<
  typeof passwordResetRequestSchema
>;

/**
 * Password Reset Schema
 */
export const passwordResetSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Şifre zorunludur')
      .min(8, 'Şifre en az 8 karakter olmalıdır')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'
      ),
    confirmPassword: z.string().min(1, 'Şifre tekrarı zorunludur'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

export type PasswordResetData = z.infer<typeof passwordResetSchema>;

/**
 * Password Change Schema (for logged-in users)
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Mevcut şifre zorunludur')
      .min(8, 'Geçersiz şifre'),
    newPassword: z
      .string()
      .min(1, 'Yeni şifre zorunludur')
      .min(8, 'Yeni şifre en az 8 karakter olmalıdır')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'
      ),
    confirmNewPassword: z.string().min(1, 'Yeni şifre tekrarı zorunludur'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Yeni şifreler eşleşmiyor',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Yeni şifre mevcut şifreden farklı olmalıdır',
    path: ['newPassword'],
  });

export type PasswordChangeData = z.infer<typeof passwordChangeSchema>;
