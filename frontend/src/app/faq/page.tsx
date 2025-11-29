'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, HelpCircle, X } from 'lucide-react';
import Card from '@/components/common/Card';

const faqs = [
  {
    question: 'Nasıl rota ararım?',
    answer: 'Ana sayfadan "Rota Ara" butonuna tıklayın. Başlangıç ve varış noktalarınızı girin, ulaşım modlarını seçin ve "Rota Ara" butonuna basın. Size en uygun rotalar listelenecektir.',
  },
  {
    question: 'Hangi ulaşım modları destekleniyor?',
    answer: 'Otobüs, Metro, Ankaray, yürüyüş ve taksi gibi farklı ulaşım modlarını destekliyoruz. Rota ararken tercih ettiğiniz modları seçebilirsiniz.',
  },
  {
    question: 'Rotalardaki durakları görebilir miyim?',
    answer: 'Evet! Bir rota seçtiğinizde, harita üzerinde otobüs, metro ve ankaray durakları özel ikonlarla gösterilir. Durak isimlerini görmek için üzerlerine tıklayabilirsiniz.',
  },
  {
    question: 'Favori rotalarımı nasıl kaydederim?',
    answer: 'Bir rota seçtikten sonra, rota kartındaki kalp ikonuna tıklayarak favori rotalarınıza ekleyebilirsiniz. Favorilerinize "Favori Rotalar" sayfasından erişebilirsiniz.',
  },
  {
    question: 'Sık kullandığım yerleri kaydedebilir miyim?',
    answer: 'Evet! "Kayıtlı Yerler" sayfasından ev, iş, okul gibi sık kullandığınız yerleri kaydedebilirsiniz. Bu sayede rota ararken hızlıca erişebilirsiniz.',
  },
  {
    question: 'Gezilecek yerler özelliği nasıl çalışır?',
    answer: 'Bir rota seçtiğinizde, varış noktanızın yakınındaki müzeler, parklar, restoranlar ve diğer ilgi çekici yerler otomatik olarak önerilir. "Çevredeki Gezilecek Yerler" panelini genişleterek görebilirsiniz.',
  },
  {
    question: 'Gerçek zamanlı durak bilgileri var mı?',
    answer: 'Şu anda Google Places API kullanarak durak konumlarını gösteriyoruz. Gerçek zamanlı araç takibi ve varış süreleri için EGO\'nun resmi verilerine ihtiyaç duyulmaktadır.',
  },
  {
    question: 'Mobil cihazlarda kullanabilir miyim?',
    answer: 'Evet! Platformumuz mobil uyumlu (responsive) tasarıma sahiptir. Telefonunuzdan veya tabletinizden rahatça kullanabilirsiniz.',
  },
  {
    question: 'Hesap oluşturmak zorunda mıyım?',
    answer: 'Temel rota arama özelliklerini kullanmak için hesap oluşturmanıza gerek yoktur. Ancak favori rotalar ve kayıtlı yerler gibi kişisel özellikleri kullanmak için giriş yapmanız gerekmektedir.',
  },
  {
    question: 'Verilerim güvende mi?',
    answer: 'Evet, tüm verileriniz güvenli bir şekilde saklanmaktadır. Kişisel bilgileriniz üçüncü taraflarla paylaşılmaz ve sadece hizmet kalitesini artırmak için kullanılır.',
  },
];

export default function FAQPage() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 shadow-xl border-b border-white/10 sticky top-0 z-40 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 hover:scale-110 backdrop-blur-sm shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-7 h-7" />
                  Sıkça Sorulan Sorular
                </h1>
                <p className="text-blue-100 text-sm mt-0.5">
                  Merak ettikleriniz burada
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card variant="glass" className="p-6 mb-6 animate-scale-in">
          <div className="text-center">
            <HelpCircle className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Size Nasıl Yardımcı Olabiliriz?
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              En sık sorulan soruların cevaplarını aşağıda bulabilirsiniz
            </p>
          </div>
        </Card>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card
              key={index}
              variant="glass"
              className="animate-scale-in overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` } as any}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full p-6 flex items-start justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all duration-300"
              >
                <div className="flex-1 text-left pr-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                    {faq.question}
                  </h3>
                  {expandedIndex === index && (
                    <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm leading-relaxed animate-fade-in">
                      {faq.answer}
                    </p>
                  )}
                </div>
                {expandedIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-blue-500 flex-shrink-0 transition-transform" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform" />
                )}
              </button>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <Card variant="glass" className="p-6 mt-8 text-center animate-scale-in">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">
            Sorunuza cevap bulamadınız mı?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Bizimle iletişime geçmekten çekinmeyin
          </p>
          <a
            href="mailto:destek@ulasimplatformu.com"
            className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
          >
            İletişime Geç
          </a>
        </Card>
      </main>
    </div>
  );
}
