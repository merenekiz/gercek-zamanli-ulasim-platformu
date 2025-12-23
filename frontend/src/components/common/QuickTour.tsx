'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import Button from './Button';

interface TourStep {
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    title: 'Hoş Geldiniz! 👋',
    description: 'Ankara Gerçek Zamanlı Ulaşım Platformuna hoş geldiniz! Size platformun özelliklerini tanıtmak istiyoruz.',
  },
  {
    title: 'Rota Arama 🔍',
    description: 'Başlangıç ve varış noktalarınızı girerek size en uygun rotaları bulabilirsiniz. Otobüs, metro, ankaray ve yürüyüş seçenekleri arasından seçim yapabilirsiniz.',
    target: '[data-tour="route-search"]',
    position: 'bottom',
  },
  {
    title: 'Favori Rotalar ❤️',
    description: 'Sık kullandığınız rotaları favorilere ekleyerek hızlı erişim sağlayabilirsiniz. Kalp ikonuna tıklayarak favori rotalarınızı yönetebilirsiniz.',
    target: '[data-tour="favorites"]',
    position: 'bottom',
  },
  {
    title: 'Seyahat Geçmişi 🕐',
    description: 'Geçmiş seyahatlerinizi inceleyin ve tekrar kullanmak için "Tekrarla" butonuna tıklayın.',
    target: '[data-tour="history"]',
    position: 'bottom',
  },
  {
    title: 'Yakınımdaki Duraklar 🚏',
    description: 'Konumunuza yakın otobüs, metro ve ankaray duraklarını haritada görebilirsiniz. Her durak türü için özel ikonlar kullanılır.',
    target: '[data-tour="stops"]',
    position: 'bottom',
  },
  {
    title: 'Kayıtlı Yerler 📍',
    description: 'Ev, iş, okul gibi sık kullandığınız yerleri kaydederek rota aramada hızlıca kullanabilirsiniz.',
    target: '[data-tour="places"]',
    position: 'bottom',
  },
  {
    title: 'Hazırsınız! 🚀',
    description: 'Artık platformun tüm özelliklerini kullanmaya hazırsınız. İyi yolculuklar!',
  },
];

export default function QuickTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(true);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user has seen the tour
    const tourSeen = localStorage.getItem('quickTourSeen');
    if (!tourSeen) {
      // Show tour after a short delay
      setTimeout(() => {
        setIsOpen(true);
        setHasSeenTour(false);
      }, 1500);
    }
  }, []);

  useEffect(() => {
    if (isOpen && tourSteps[currentStep].target) {
      updatePositions();
      window.addEventListener('resize', updatePositions);
      return () => window.removeEventListener('resize', updatePositions);
    }
  }, [isOpen, currentStep]);

  const updatePositions = () => {
    const step = tourSteps[currentStep];
    if (!step.target) return;

    const targetElement = document.querySelector(step.target);
    if (!targetElement) return;

    // Scroll element into view smoothly - center element so tooltip can appear below
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center', // Element in center, tooltip below with space
      inline: 'center',
    });

    // Wait for scroll to complete before calculating positions
    setTimeout(() => {
      const rect = targetElement.getBoundingClientRect();
      const padding = 12; // Increased padding for better visibility

      // Highlight position (around target element)
      setHighlightPosition({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // Popup position (relative to target) - default to bottom
      const popupWidth = 360;
      const popupHeight = 200;
      let top = 0;
      let left = 0;

      switch (step.position) {
        case 'right':
          top = rect.top + rect.height / 2 - popupHeight / 2;
          left = rect.right + 24;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - popupHeight / 2;
          left = rect.left - popupWidth - 24;
          break;
        case 'top':
          top = rect.top - popupHeight - 24;
          left = rect.left + rect.width / 2 - popupWidth / 2;
          break;
        case 'bottom':
        default:
          // Default to bottom - show tooltip below the element
          top = rect.bottom + 24;
          left = rect.left + rect.width / 2 - popupWidth / 2;
          break;
      }

      // Ensure popup stays within viewport
      if (left < 16) left = 16;
      if (left + popupWidth > window.innerWidth - 16) left = window.innerWidth - popupWidth - 16;
      if (top < 16) top = 16;
      if (top + popupHeight > window.innerHeight - 16) top = window.innerHeight - popupHeight - 16;

      setPopupPosition({ top, left });
    }, 150); // Wait for smooth scroll animation
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('quickTourSeen', 'true');
    setHasSeenTour(true);
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const startTour = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  if (!isOpen) {
    // Show "Start Tour" button if user has seen it before
    if (hasSeenTour) {
      return (
        <button
          onClick={startTour}
          className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 hover:scale-110 transition-all duration-300 flex items-center gap-2 group"
          title="Hızlı Turu Başlat"
        >
          <Sparkles className="w-5 h-5" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-medium">
            Hızlı Tur
          </span>
        </button>
      );
    }
    return null;
  }

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const hasTarget = !!step.target;

  return (
    <>
      {/* Overlay - darken everything except highlighted element */}
      <div className="fixed inset-0 z-[60] pointer-events-none transition-all duration-150">
        {/* Top */}
        <div
          className="absolute top-0 left-0 right-0 bg-black/15 backdrop-blur-sm transition-all duration-150"
          style={{
            height: hasTarget ? highlightPosition.top : '100%',
          }}
        />

        {hasTarget && (
          <>
            {/* Left */}
            <div
              className="absolute bg-black/15 backdrop-blur-sm transition-all duration-150"
              style={{
                top: highlightPosition.top,
                left: 0,
                width: highlightPosition.left,
                height: highlightPosition.height,
              }}
            />

            {/* Right */}
            <div
              className="absolute bg-black/15 backdrop-blur-sm transition-all duration-150"
              style={{
                top: highlightPosition.top,
                left: highlightPosition.left + highlightPosition.width,
                right: 0,
                height: highlightPosition.height,
              }}
            />

            {/* Bottom */}
            <div
              className="absolute left-0 right-0 bottom-0 bg-black/15 backdrop-blur-sm transition-all duration-150"
              style={{
                top: highlightPosition.top + highlightPosition.height,
              }}
            />

            {/* Highlight border with glow effect */}
            <div
              className="absolute border-4 border-purple-500 rounded-xl animate-pulse transition-all duration-150"
              style={{
                top: highlightPosition.top,
                left: highlightPosition.left,
                width: highlightPosition.width,
                height: highlightPosition.height,
                boxShadow: '0 0 40px rgba(168, 85, 247, 0.8), 0 0 80px rgba(168, 85, 247, 0.4)',
              }}
            />

            {/* Additional inner glow */}
            <div
              className="absolute rounded-xl pointer-events-none transition-all duration-150"
              style={{
                top: highlightPosition.top,
                left: highlightPosition.left,
                width: highlightPosition.width,
                height: highlightPosition.height,
                background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
              }}
            />
          </>
        )}
      </div>

      {/* Tour popup */}
      <div
        ref={popupRef}
        className="fixed z-[61] pointer-events-auto animate-scale-in transition-all duration-150"
        style={{
          top: hasTarget ? `${popupPosition.top}px` : '50%',
          left: hasTarget ? `${popupPosition.left}px` : '50%',
          transform: hasTarget ? 'none' : 'translate(-50%, -50%)',
          width: '360px',
        }}
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 via-pink-600 to-red-500 p-4 text-white">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">{step.title}</h3>
                <p className="text-xs text-white/90">
                  Adım {currentStep + 1} / {tourSteps.length}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-all duration-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Footer */}
          <div className="px-4 pb-4 flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-6 bg-gradient-to-r from-purple-500 to-pink-600'
                      : index < currentStep
                      ? 'w-1.5 bg-purple-300 dark:bg-purple-700'
                      : 'w-1.5 bg-gray-300 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-1.5">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex items-center gap-1 text-xs py-1.5 px-3"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Geri
                </Button>
              )}

              {!isLastStep && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="text-gray-600 dark:text-gray-400 text-xs py-1.5 px-3"
                >
                  Geç
                </Button>
              )}

              <Button
                variant="primary"
                onClick={handleNext}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 flex items-center gap-1 text-xs py-1.5 px-3"
              >
                {isLastStep ? 'Başla' : 'İleri'}
                {!isLastStep && <ChevronRight className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
