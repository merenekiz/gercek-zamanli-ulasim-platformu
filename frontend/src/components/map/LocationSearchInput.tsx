'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { Loader } from '@googlemaps/js-api-loader';

interface Location {
  lat: number;
  lng: number;
  display_name: string;
  place_id: string;
}

interface LocationSearchInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onLocationSelect: (location: Location) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * LocationSearchInput Component
 *
 * Autocomplete input for location search using Google Places API
 *
 * @example
 * <LocationSearchInput
 *   label="Nereden"
 *   placeholder="Başlangıç noktası girin"
 *   onLocationSelect={(loc) => console.log(loc)}
 * />
 */
export default function LocationSearchInput({
  label,
  placeholder = 'Konum ara...',
  value: initialValue = '',
  onLocationSelect,
  error,
  disabled = false,
}: LocationSearchInputProps) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Initialize Google Places API
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    console.log('[LocationSearchInput] Initializing... API Key:', apiKey ? 'Var' : 'Yok');

    if (!apiKey) {
      console.error('[LocationSearchInput] Google Maps API key bulunamadı');
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geocoding'],
    });

    console.log('[LocationSearchInput] Google API yükleniyor...');

    loader
      .load()
      .then(() => {
        console.log('[LocationSearchInput] Google API yüklendi!');
        geocoderRef.current = new google.maps.Geocoder();
        setGoogleLoaded(true);
      })
      .catch((error) => {
        console.error('[LocationSearchInput] Google Places API yükleme hatası:', error);
      });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search locations with Google Geocoding API (simpler, no extra permissions needed)
  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2 || !googleLoaded || !geocoderRef.current) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      console.log('[LocationSearchInput] Searching for:', searchQuery);

      // Use Geocoding API for address search
      geocoderRef.current.geocode(
        {
          address: searchQuery,
          region: 'tr', // Turkey
          language: 'tr',
        },
        (results, status) => {
          console.log('[LocationSearchInput] Geocode status:', status);

          if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
            const locations: Location[] = results.slice(0, 5).map((result) => ({
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng(),
              display_name: result.formatted_address,
              place_id: result.place_id || '',
            }));

            console.log('[LocationSearchInput] Found locations:', locations.length);
            setResults(locations);
            setShowDropdown(true);
          } else {
            console.log('[LocationSearchInput] No results found');
            setResults([]);
          }

          setLoading(false);
        }
      );
    } catch (error) {
      console.error('[LocationSearchInput] Geocoding search error:', error);
      setResults([]);
      setLoading(false);
    }
  };

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedLocation(null);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      searchLocations(newQuery);
    }, 300);
  };

  // Handle location selection
  const handleLocationSelect = async (location: Location) => {
    console.log('[LocationSearchInput] Location selected:', location);

    setQuery(location.display_name);
    setShowDropdown(false);
    setResults([]);

    // Coordinates are already in the location object from geocoding
    setSelectedLocation(location);
    onLocationSelect(location);
  };

  // Handle clear
  const handleClear = () => {
    setQuery('');
    setSelectedLocation(null);
    setResults([]);
    setShowDropdown(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}

      <div className="relative group">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-primary transition-colors duration-300" />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled || !googleLoaded}
          className={`
            block w-full pl-10 pr-10 py-3
            border-2 rounded-xl transition-all duration-300
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
            hover:border-gray-400 dark:hover:border-gray-500
            disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60
            ${error ? 'border-warning focus:ring-warning/20 focus:border-warning' : 'border-gray-200 dark:border-gray-700'}
          `}
        />

        {/* Loading/Clear Icon */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center z-10">
          {loading ? (
            <Loader2 className="h-5 w-5 text-gray-400 dark:text-gray-500 animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary-400 transition-colors duration-300 hover:scale-110 transition-transform"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-warning font-medium animate-fade-in">{error}</p>
      )}

      {/* API Key Warning */}
      {!googleLoaded && (
        <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          Google Maps yükleniyor...
        </p>
      )}

      {/* Dropdown Results */}
      {showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-80 overflow-y-auto backdrop-blur-lg"
        >
          {results.map((location, index) => (
            <button
              key={location.place_id}
              type="button"
              onClick={() => handleLocationSelect(location)}
              className="w-full px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-start gap-3 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0 group"
            >
              <MapPin className="w-5 h-5 text-primary dark:text-primary-400 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {location.display_name.split(',')[0]}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {location.display_name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showDropdown && !loading && query.length >= 2 && results.length === 0 && googleLoaded && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Sonuç bulunamadı
          </p>
        </div>
      )}
    </div>
  );
}
