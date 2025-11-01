'use client';

import { useRouter } from 'next/navigation';
import {
  MapPin,
  Clock,
  Heart,
  Search,
  Navigation,
  LogOut,
  User as UserIcon,
  Bus,
  Car,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { logout } from '@/lib/store/slices/authSlice';
import { showToast } from '@/lib/store/slices/uiSlice';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import ThemeToggle from '@/components/common/ThemeToggle';

function DashboardContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      dispatch(
        showToast({
          message: 'Başarıyla çıkış yaptınız',
          type: 'success',
        })
      );
      router.push('/login');
    } catch (error: any) {
      dispatch(
        showToast({
          message: 'Çıkış yapılırken bir hata oluştu',
          type: 'error',
        })
      );
    }
  };

  const quickActions = [
    {
      icon: Search,
      title: 'Rota Ara',
      description: 'Gideceğiniz yere en hızlı rotayı bulun',
      color: 'bg-blue-500',
      href: '/routes/search',
    },
    {
      icon: Navigation,
      title: 'Yakınımdaki Duraklar',
      description: 'Etrafınızdaki toplu taşıma duraklarını görün',
      color: 'bg-green-500',
      href: '/stops',
    },
    {
      icon: Heart,
      title: 'Favori Rotalar',
      description: 'Sık kullandığınız rotalarınız',
      color: 'bg-red-500',
      href: '/favorites',
    },
    {
      icon: Clock,
      title: 'Seyahat Geçmişi',
      description: 'Geçmiş seyahatlerinizi inceleyin',
      color: 'bg-purple-500',
      href: '/history',
    },
  ];

  const stats = [
    { label: 'Toplam Seyahat', value: '0', icon: Bus, color: 'text-blue-600' },
    { label: 'Favori Rotalar', value: '0', icon: Heart, color: 'text-red-600' },
    { label: 'Kayıtlı Yerler', value: '0', icon: MapPin, color: 'text-green-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl mr-3">
                <svg
                  className="w-6 h-6 text-white"
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
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Gerçek Zamanlı Ulaşım
              </h1>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Çıkış
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Hoş geldiniz, {user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Ankara şehrinde ulaşımınızı kolaylaştırmak için buradayız.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color}`}>
                  <stat.icon className="w-8 h-8" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Hızlı İşlemler
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Card
                key={action.title}
                className="p-6 cursor-pointer transition-all hover:scale-105"
                onClick={() => router.push(action.href)}
              >
                <div
                  className={`${action.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}
                >
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {action.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Son Aktiviteler
          </h3>
          <Card className="p-8">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
              <p className="text-lg font-medium mb-2">
                Henüz aktivite bulunmuyor
              </p>
              <p className="text-sm mb-6">
                Rota aramaya başlayarak seyahat geçmişinizi oluşturun
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/routes/search')}
                leftIcon={<Search className="w-4 h-4" />}
              >
                Rota Ara
              </Button>
            </div>
          </Card>
        </div>

        {/* Help Section */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">
                Yardıma mı ihtiyacınız var?
              </h4>
              <p className="text-blue-800 mb-4">
                Platformu kullanmaya başlamak için hızlı turumuzdan faydalanabilir
                veya SSS bölümümüze göz atabilirsiniz.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  Hızlı Tur
                </Button>
                <Button variant="outline" size="sm">
                  SSS
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
