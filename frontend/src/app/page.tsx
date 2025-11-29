export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white py-4 px-6 shadow-lg">
        <h1 className="text-2xl font-bold">Ankara Ulaşım Platformu</h1>
        <p className="text-primary-100 text-sm mt-1">
          Gerçek zamanlı toplu taşıma ve çok modlu seyahat planlama
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Card */}
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-primary mb-4">
              Hoş Geldiniz!
            </h2>
            <p className="text-neutral-700 mb-4">
              Ankara Ulaşım Platformu, şehir içi ulaşımınızı kolaylaştırmak için
              tasarlanmış kapsamlı bir çözüm sunar.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-success"
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
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    Rota Planlama
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Çok modlu seyahat seçenekleri ile en uygun rotayı bulun
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    Gerçek Zamanlı Takip
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Toplu taşıma araçlarını anlık olarak takip edin
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-warning-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-warning"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    Yer Tavsiyeleri
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Yakınınızdaki ilgi çekici yerleri keşfedin
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    Ücret Karşılaştırma
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Taksi ve araç paylaşım fiyatlarını karşılaştırın
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="card">
            <h2 className="text-lg font-bold text-primary mb-3">
              Proje Durumu
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-neutral-200">
                <span className="text-sm text-neutral-700">Frontend & UI</span>
                <span className="badge badge-success">Tamamlandı</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-200">
                <span className="text-sm text-neutral-700">Backend API</span>
                <span className="badge badge-success">Tamamlandı</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-200">
                <span className="text-sm text-neutral-700">Google Maps & Places API</span>
                <span className="badge badge-success">Tamamlandı</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-200">
                <span className="text-sm text-neutral-700">Transit Durakları</span>
                <span className="badge badge-success">Tamamlandı</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-neutral-700">Gezilecek Yerler Önerileri</span>
                <span className="badge badge-success">Tamamlandı</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="mt-8 text-center text-sm text-neutral-500">
            <p>Versiyon 0.6.0 - Aktif Geliştirme</p>
            <p className="mt-1">Ankara Pilot Projesi</p>
          </div>
        </div>
      </main>
    </div>
  );
}
