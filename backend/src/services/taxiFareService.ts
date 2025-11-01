/**
 * Taksi Ücret Hesaplama Servisi
 *
 * Bu servis, veritabanındaki taksi ücret tarifelerine göre
 * mesafe, süre ve ek koşullara göre taksi ücreti hesaplar.
 *
 * Ücret Parametreleri (Veritabanından):
 * - Açılış Ücreti (opening_fee)
 * - Kilometre Başı Ücret (per_km_rate)
 * - Minimum Tarife / İndi Bindi Ücreti (min_fare)
 * - Bekleme Ücreti/Saat (waiting_fee_per_hour)
 * - Gece Tarifesi Ek Yüzdesi (night_surcharge_rate)
 * - Havaalanı Ek Ücreti (airport_surcharge)
 */

import {
  ITaxiFare,
  TaxiFareCalculationInput,
  TaxiFareCalculationResult,
} from '../types';

export class TaxiFareService {
  /**
   * Taksi ücretini hesaplar
   *
   * @param fareConfig - Veritabanından alınan ücret yapılandırması
   * @param input - Hesaplama girdileri (mesafe, süre, vb.)
   * @returns Detaylı ücret hesaplama sonucu
   */
  static calculateFare(
    fareConfig: ITaxiFare,
    input: TaxiFareCalculationInput
  ): TaxiFareCalculationResult {
    // Mesafeyi metre'den kilometre'ye çevir
    const distanceKm = input.distance / 1000;

    // 1. Açılış Ücreti
    const baseFare = fareConfig.openingFee;

    // 2. Mesafe Ücreti (km * km başı ücret)
    const distanceFare = distanceKm * fareConfig.perKmRate;

    // 3. Bekleme Ücreti
    let waitingFare = 0;
    if (input.waitingTime && input.waitingTime > 0) {
      // Bekleme süresini dakikadan saate çevir
      const waitingHours = input.waitingTime / 60;
      waitingFare = waitingHours * fareConfig.waitingFeePerHour;
    }

    // 4. Gece Tarifesi Ek Ücreti
    let nightSurcharge = 0;
    if (input.isNightTime && fareConfig.nightSurchargeRate) {
      // Gece tarifesi, temel ücretlerin üzerine yüzde olarak eklenir
      const baseAmount = baseFare + distanceFare + waitingFare;
      nightSurcharge = (baseAmount * fareConfig.nightSurchargeRate) / 100;
    }

    // 5. Havaalanı Ek Ücreti
    let airportSurcharge = 0;
    if (input.isAirport && fareConfig.airportSurcharge) {
      airportSurcharge = fareConfig.airportSurcharge;
    }

    // Toplam Ücret Hesaplama
    let totalFare = baseFare + distanceFare + waitingFare + nightSurcharge + airportSurcharge;

    // Minimum tarife kontrolü (İndi Bindi Ücreti)
    if (totalFare < fareConfig.minFare) {
      totalFare = fareConfig.minFare;
    }

    // Sonuç nesnesi
    const result: TaxiFareCalculationResult = {
      baseFare,
      distanceFare,
      waitingFare,
      nightSurcharge,
      airportSurcharge,
      totalFare: this.roundToTwoDecimals(totalFare),
      currency: 'TRY',
      breakdown: {
        openingFee: this.roundToTwoDecimals(baseFare),
        distanceCharge: this.roundToTwoDecimals(distanceFare),
        waitingCharge: this.roundToTwoDecimals(waitingFare),
        surcharges: this.roundToTwoDecimals(nightSurcharge + airportSurcharge),
      },
    };

    return result;
  }

  /**
   * Birden fazla sağlayıcı için ücret tahminlerini karşılaştırır
   *
   * @param taxiFare - Yerel taksi tarifesi
   * @param distance - Mesafe (metre)
   * @param duration - Süre (dakika)
   * @param options - Ek seçenekler
   * @returns Karşılaştırmalı ücret tahminleri
   */
  static async compareProviderEstimates(
    taxiFare: ITaxiFare,
    distance: number,
    duration: number,
    options?: {
      isNightTime?: boolean;
      isAirport?: boolean;
      waitingTime?: number;
    }
  ): Promise<{
    taxi: TaxiFareCalculationResult;
    uber?: any; // Uber API entegrasyonundan gelecek
    bolt?: any; // Bolt API entegrasyonundan gelecek
    cheapest: 'TAXI' | 'UBER' | 'BOLT';
  }> {
    // Yerel taksi ücreti hesapla
    const taxiEstimate = this.calculateFare(taxiFare, {
      distance,
      duration,
      isNightTime: options?.isNightTime,
      isAirport: options?.isAirport,
      waitingTime: options?.waitingTime,
    });

    // TODO: Uber ve Bolt API entegrasyonları
    // const uberEstimate = await getUberPriceEstimate(...);
    // const boltEstimate = await getBoltPriceEstimate(...);

    // Şu an için sadece taksi tahmini döndür
    return {
      taxi: taxiEstimate,
      cheapest: 'TAXI',
    };
  }

  /**
   * Saat bazında gece tarifesi olup olmadığını kontrol eder
   *
   * @param date - Kontrol edilecek tarih (varsayılan: şimdi)
   * @returns Gece tarifesi geçerli mi?
   */
  static isNightTime(date: Date = new Date()): boolean {
    const hour = date.getHours();
    // Gece tarifesi: 00:00 - 06:00 arası (ayarlanabilir)
    return hour >= 0 && hour < 6;
  }

  /**
   * Koordinatlara göre havaalanı yakınlığını kontrol eder
   *
   * @param lat - Enlem
   * @param lng - Boylam
   * @returns Havaalanı yakınında mı?
   */
  static isNearAirport(lat: number, lng: number): boolean {
    // Esenboğa Havaalanı koordinatları
    const esenbogaLat = 40.1281;
    const esenbogaLng = 32.9951;

    // Basit mesafe hesaplama (yaklaşık 5km içinde)
    const distance = this.calculateDistanceBetweenPoints(
      lat,
      lng,
      esenbogaLat,
      esenbogaLng
    );

    // 5km yarıçapında havaalanı ek ücreti uygula
    return distance <= 5000;
  }

  /**
   * İki nokta arasındaki mesafeyi hesaplar (Haversine formülü)
   *
   * @param lat1 - İlk nokta enlem
   * @param lng1 - İlk nokta boylam
   * @param lat2 - İkinci nokta enlem
   * @param lng2 - İkinci nokta boylam
   * @returns Mesafe (metre)
   */
  static calculateDistanceBetweenPoints(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371e3; // Dünya yarıçapı (metre)
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // metre
  }

  /**
   * Sayıyı iki ondalık basamağa yuvarlar
   */
  private static roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Ücret hesaplama için özet rapor oluşturur
   *
   * @param result - Hesaplama sonucu
   * @returns İnsan okunabilir özet
   */
  static generateFareSummary(result: TaxiFareCalculationResult): string {
    let summary = `Taksi Ücreti Özeti:\n`;
    summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    summary += `Açılış Ücreti: ${result.breakdown.openingFee.toFixed(2)} ${result.currency}\n`;
    summary += `Mesafe Ücreti: ${result.breakdown.distanceCharge.toFixed(2)} ${result.currency}\n`;

    if (result.breakdown.waitingCharge > 0) {
      summary += `Bekleme Ücreti: ${result.breakdown.waitingCharge.toFixed(2)} ${result.currency}\n`;
    }

    if (result.breakdown.surcharges > 0) {
      summary += `Ek Ücretler: ${result.breakdown.surcharges.toFixed(2)} ${result.currency}\n`;
    }

    summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    summary += `TOPLAM: ${result.totalFare.toFixed(2)} ${result.currency}\n`;

    return summary;
  }
}

export default TaxiFareService;
