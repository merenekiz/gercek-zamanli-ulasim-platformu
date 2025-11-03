'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, AlertCircle, Check, X, Eye, EyeOff } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { register as registerUser } from '@/lib/store/slices/authSlice';
import { registerSchema, type RegisterFormData } from '@/lib/validation/auth';
import { showToast } from '@/lib/store/slices/uiSlice';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import ThemeToggle from '@/components/common/ThemeToggle';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const password = watch('password');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Password strength validation
  const passwordValidations = {
    minLength: password?.length >= 8,
    hasUpperCase: /[A-Z]/.test(password || ''),
    hasLowerCase: /[a-z]/.test(password || ''),
    hasNumber: /\d/.test(password || ''),
  };

  const passwordStrength =
    Object.values(passwordValidations).filter(Boolean).length;

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Remove confirmPassword and terms before sending to API
      const { confirmPassword, terms, ...registerData } = data;

      const result = await dispatch(registerUser(registerData)).unwrap();

      dispatch(
        showToast({
          message: 'Hesabınız başarıyla oluşturuldu!',
          type: 'success',
        })
      );

      // Redirect to dashboard or verification page
      router.push('/dashboard');
    } catch (error: any) {
      dispatch(
        showToast({
          message: error.message || 'Kayıt olurken bir hata oluştu',
          type: 'error',
        })
      );
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-200';
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'Zayıf';
    if (passwordStrength === 3) return 'Orta';
    return 'Güçlü';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-success-50 via-primary-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-success/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' } as any}></div>
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-success rounded-3xl mb-6 shadow-xl hover:scale-110 transition-transform duration-300 animate-float">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-success to-success-600 dark:from-success-400 dark:to-success-600 bg-clip-text text-transparent mb-2">
            Gerçek Zamanlı Ulaşım
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Hesap oluşturun</p>
        </div>

        {/* Register Form Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/50">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name Input */}
            <Input
              label="Ad Soyad"
              type="text"
              placeholder="Ahmet Yılmaz"
              error={errors.name?.message}
              leftIcon={<User className="w-5 h-5" />}
              autoComplete="name"
              {...register('name')}
            />

            {/* Email Input */}
            <Input
              label="E-posta Adresi"
              type="email"
              placeholder="ornek@email.com"
              error={errors.email?.message}
              leftIcon={<Mail className="w-5 h-5" />}
              autoComplete="email"
              {...register('email')}
            />

            {/* Password Input */}
            <div>
              <Input
                label="Şifre"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                leftIcon={<Lock className="w-5 h-5" />}
                rightIcon={
                  showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )
                }
                onRightIconClick={() => setShowPassword(!showPassword)}
                autoComplete="new-password"
                {...register('password')}
              />

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Şifre gücü:</span>
                    <span
                      className={`font-medium ${
                        passwordStrength <= 2
                          ? 'text-red-600 dark:text-red-400'
                          : passwordStrength === 3
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {getStrengthText()}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength
                            ? getStrengthColor()
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <ul className="space-y-1 text-xs">
                    <li
                      className={`flex items-center gap-1 ${
                        passwordValidations.minLength
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {passwordValidations.minLength ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      En az 8 karakter
                    </li>
                    <li
                      className={`flex items-center gap-1 ${
                        passwordValidations.hasUpperCase
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {passwordValidations.hasUpperCase ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      Bir büyük harf
                    </li>
                    <li
                      className={`flex items-center gap-1 ${
                        passwordValidations.hasLowerCase
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {passwordValidations.hasLowerCase ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      Bir küçük harf
                    </li>
                    <li
                      className={`flex items-center gap-1 ${
                        passwordValidations.hasNumber
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {passwordValidations.hasNumber ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      Bir rakam
                    </li>
                  </ul>
                </div>
              )}

            </div>

            {/* Confirm Password Input */}
            <Input
              label="Şifre Tekrarı"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )
              }
              onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
              autoComplete="new-password"
              {...register('confirmPassword')}
            />

            {/* Terms and Conditions */}
            <div>
              <label className="flex items-start">
                <input
                  type="checkbox"
                  {...register('terms')}
                  className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 mt-0.5"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  <Link
                    href="/terms"
                    className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                  >
                    Kullanım koşullarını
                  </Link>{' '}
                  ve{' '}
                  <Link
                    href="/privacy"
                    className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                  >
                    gizlilik politikasını
                  </Link>{' '}
                  kabul ediyorum
                </span>
              </label>
              {errors.terms && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.terms.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting || loading}
              disabled={isSubmitting || loading}
            >
              Kayıt Ol
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">veya</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Zaten hesabınız var mı?{' '}
              <Link
                href="/login"
                className="font-medium text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
              >
                Giriş yapın
              </Link>
            </p>
          </div>
        </div>

        {/* Info Notice */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">E-posta Doğrulama</p>
              <p className="text-blue-700 dark:text-blue-300">
                Kayıt sonrası e-posta adresinize doğrulama bağlantısı
                gönderilecektir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
