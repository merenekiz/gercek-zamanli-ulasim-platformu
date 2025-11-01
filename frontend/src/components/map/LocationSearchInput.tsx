'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import axios from 'axios';

interface Location {
  lat: number;
  lng: number;
  display_name: string;
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
 * Autocomplete input for location search using Nominatim API
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Search locations with Nominatim API
  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get(
        'https://nominatim.openstreetmap.org/search',
        {
          params: {
            q: `${searchQuery}, Ankara, Turkey`,
            format: 'json',
            addressdetails: 1,
            limit: 5,
            countrycodes: 'tr',
          },
          headers: {
            'User-Agent': 'AnkaraUlasimPlatformu/1.0',
          },
        }
      );

      const locations: Location[] = response.data.map((item: any) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        display_name: item.display_name,
      }));

      setResults(locations);
      setShowDropdown(true);
    } catch (error) {
      console.error('Geocoding error:', error);
      setResults([]);
    } finally {
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
    }, 500);
  };

  // Handle location selection
  const handleLocationSelect = (location: Location) => {
    setQuery(location.display_name);
    setSelectedLocation(location);
    setShowDropdown(false);
    setResults([]);
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            block w-full pl-10 pr-10 py-2.5
            border rounded-lg
            focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-gray-300'}
          `}
        />

        {/* Loading/Clear Icon */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {loading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown Results */}
      {showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {results.map((location, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleLocationSelect(location)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {location.display_name.split(',')[0]}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {location.display_name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showDropdown && !loading && query.length >= 3 && results.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4"
        >
          <p className="text-sm text-gray-500 text-center">
            Sonuç bulunamadı
          </p>
        </div>
      )}
    </div>
  );
}
