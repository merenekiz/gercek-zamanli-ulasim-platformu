'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Home,
  Briefcase,
  GraduationCap,
  Heart,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Navigation,
} from 'lucide-react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import { useAppDispatch } from '@/lib/store/hooks';
import { showToast } from '@/lib/store/slices/uiSlice';

interface SavedPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'home' | 'work' | 'school' | 'favorite' | 'other';
  createdAt: string;
}

const placeTypeConfig = {
  home: {
    label: 'Ev',
    icon: Home,
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
    lightBg: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  work: {
    label: 'İş',
    icon: Briefcase,
    color: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600',
    lightBg: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-600 dark:text-purple-400',
  },
  school: {
    label: 'Okul',
    icon: GraduationCap,
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
    lightBg: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-600 dark:text-green-400',
  },
  favorite: {
    label: 'Favori',
    icon: Heart,
    color: 'bg-red-500',
    hoverColor: 'hover:bg-red-600',
    lightBg: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-600 dark:text-red-400',
  },
  other: {
    label: 'Diğer',
    icon: MapPin,
    color: 'bg-gray-500',
    hoverColor: 'hover:bg-gray-600',
    lightBg: 'bg-gray-50 dark:bg-gray-900/20',
    textColor: 'text-gray-600 dark:text-gray-400',
  },
};

function PlacesContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState<SavedPlace | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    lat: 0,
    lng: 0,
    type: 'other' as SavedPlace['type'],
  });

  // Load saved places from localStorage
  useEffect(() => {
    const savedPlaces = localStorage.getItem('savedPlaces');
    if (savedPlaces) {
      try {
        const parsedPlaces = JSON.parse(savedPlaces);
        setPlaces(parsedPlaces);
      } catch (error) {
        console.error('Error loading saved places:', error);
      }
    }
  }, []);

  const handleAddPlace = () => {
    if (!formData.name || !formData.address) {
      dispatch(
        showToast({
          message: 'Lütfen ad ve adres giriniz',
          type: 'error',
        })
      );
      return;
    }

    const newPlace: SavedPlace = {
      id: `place_${Date.now()}`,
      ...formData,
      createdAt: new Date().toISOString(),
    };

    const updatedPlaces = [...places, newPlace];
    setPlaces(updatedPlaces);
    localStorage.setItem('savedPlaces', JSON.stringify(updatedPlaces));

    dispatch(
      showToast({
        message: 'Yer başarıyla kaydedildi',
        type: 'success',
      })
    );

    // Reset form
    setFormData({
      name: '',
      address: '',
      lat: 0,
      lng: 0,
      type: 'other',
    });
    setShowAddModal(false);
  };

  const handleUpdatePlace = () => {
    if (!editingPlace || !formData.name || !formData.address) {
      dispatch(
        showToast({
          message: 'Lütfen ad ve adres giriniz',
          type: 'error',
        })
      );
      return;
    }

    const updatedPlaces = places.map((place) =>
      place.id === editingPlace.id
        ? { ...place, ...formData }
        : place
    );

    setPlaces(updatedPlaces);
    localStorage.setItem('savedPlaces', JSON.stringify(updatedPlaces));

    dispatch(
      showToast({
        message: 'Yer başarıyla güncellendi',
        type: 'success',
      })
    );

    setEditingPlace(null);
    setFormData({
      name: '',
      address: '',
      lat: 0,
      lng: 0,
      type: 'other',
    });
  };

  const handleDeletePlace = (id: string) => {
    if (window.confirm('Bu yeri silmek istediğinizden emin misiniz?')) {
      const updatedPlaces = places.filter((place) => place.id !== id);
      setPlaces(updatedPlaces);
      localStorage.setItem('savedPlaces', JSON.stringify(updatedPlaces));

      dispatch(
        showToast({
          message: 'Yer silindi',
          type: 'success',
        })
      );
    }
  };

  const handleEditPlace = (place: SavedPlace) => {
    setEditingPlace(place);
    setFormData({
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      type: place.type,
    });
    setShowAddModal(true);
  };

  const handleUseInRoute = (place: SavedPlace) => {
    // Navigate to route search with this place as origin
    router.push(
      `/routes/search?origin=${encodeURIComponent(place.address)}`
    );
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingPlace(null);
    setFormData({
      name: '',
      address: '',
      lat: 0,
      lng: 0,
      type: 'other',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 shadow-xl border-b border-white/10 sticky top-0 z-40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
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
                  <MapPin className="w-7 h-7" />
                  Kayıtlı Yerler
                </h1>
                <p className="text-indigo-100 text-sm mt-0.5">
                  Sık kullandığınız yerleri kaydedin ve hızlıca erişin
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-white hover:bg-gray-100 text-indigo-600"
            >
              <Plus className="w-5 h-5" />
              Yer Ekle
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {places.length === 0 ? (
          // Empty State
          <Card variant="glass" className="p-12 animate-scale-in">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="inline-block p-4 bg-indigo-100 dark:bg-indigo-900/20 rounded-2xl mb-4">
                <MapPin className="w-12 h-12 mx-auto text-indigo-500 animate-pulse" />
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Henüz kayıtlı yer yok
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Ev, iş, okul gibi sık kullandığınız yerleri kaydederek rota aramada hızlıca erişebilirsiniz
              </p>
              <Button
                variant="primary"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                İlk Yerinizi Ekleyin
              </Button>
            </div>
          </Card>
        ) : (
          // Places Grid
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {places.map((place, index) => {
              const config = placeTypeConfig[place.type];
              const Icon = config.icon;

              return (
                <Card
                  key={place.id}
                  variant="gradient"
                  hover
                  animate
                  className="p-6 cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` } as any}
                  onClick={() => handleUseInRoute(place)}
                >
                  <div className="flex items-start justify-between mb-4">
                    {/* Place Type Icon */}
                    <div className={`p-3 ${config.lightBg} rounded-xl`}>
                      <Icon className={`w-6 h-6 ${config.textColor}`} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPlace(place);
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300"
                        title="Düzenle"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlace(place.id);
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Place Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 ${config.color} text-white text-xs font-bold rounded-lg`}>
                        {config.label}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {place.name}
                      </h3>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {place.address}
                      </p>
                    </div>
                  </div>

                  {/* Use in Route Button */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        Rotada kullanmak için tıklayın
                      </span>
                      <Navigation className="w-4 h-4 text-indigo-500" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card variant="glass" className="w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingPlace ? 'Yeri Düzenle' : 'Yeni Yer Ekle'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Place Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Yer Türü
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(placeTypeConfig) as Array<keyof typeof placeTypeConfig>).map((type) => {
                    const config = placeTypeConfig[type];
                    const Icon = config.icon;
                    const isSelected = formData.type === type;

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, type })}
                        className={`
                          p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center
                          ${
                            isSelected
                              ? `${config.color} border-transparent text-white scale-105 shadow-lg`
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md'
                          }
                        `}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-white' : config.textColor}`} />
                        <span className={`text-sm font-semibold block ${isSelected ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                          {config.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Yer Adı
                </label>
                <Input
                  placeholder="örn: Evim, İş Yerim"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adres
                </label>
                <Input
                  placeholder="Tam adres giriniz"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enlem (Lat)
                  </label>
                  <Input
                    type="number"
                    step="0.000001"
                    placeholder="39.9334"
                    value={formData.lat || ''}
                    onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Boylam (Lng)
                  </label>
                  <Input
                    type="number"
                    step="0.000001"
                    placeholder="32.8597"
                    value={formData.lng || ''}
                    onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button
                  variant="primary"
                  onClick={editingPlace ? handleUpdatePlace : handleAddPlace}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingPlace ? 'Güncelle' : 'Kaydet'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function PlacesPage() {
  return (
    <ProtectedRoute>
      <PlacesContent />
    </ProtectedRoute>
  );
}
