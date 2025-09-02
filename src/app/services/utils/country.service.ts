import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Country {
  id: string;
  name: string;
  code: string;
  phoneCode: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  region: string;
  isActive: boolean;
  popular: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CountryService {
  private countries: Country[] = [
    // Africa - Most Popular
    { id: 'ng', name: 'Nigeria', code: 'NG', phoneCode: '+234', flag: '🇳🇬', currency: 'NGN', currencySymbol: '₦', timezone: 'Africa/Lagos', region: 'Africa', isActive: true, popular: true },
    { id: 'gh', name: 'Ghana', code: 'GH', phoneCode: '+233', flag: '🇬🇭', currency: 'GHS', currencySymbol: '₵', timezone: 'Africa/Accra', region: 'Africa', isActive: true, popular: true },
    { id: 'ke', name: 'Kenya', code: 'KE', phoneCode: '+254', flag: '🇰🇪', currency: 'KES', currencySymbol: 'KSh', timezone: 'Africa/Nairobi', region: 'Africa', isActive: true, popular: true },
    { id: 'ug', name: 'Uganda', code: 'UG', phoneCode: '+256', flag: '🇺🇬', currency: 'UGX', currencySymbol: 'USh', timezone: 'Africa/Kampala', region: 'Africa', isActive: true, popular: true },
    { id: 'tz', name: 'Tanzania', code: 'TZ', phoneCode: '+255', flag: '🇹🇿', currency: 'TZS', currencySymbol: 'TSh', timezone: 'Africa/Dar_es_Salaam', region: 'Africa', isActive: true, popular: true },
    { id: 'zm', name: 'Zambia', code: 'ZM', phoneCode: '+260', flag: '🇿🇲', currency: 'ZMW', currencySymbol: 'ZK', timezone: 'Africa/Lusaka', region: 'Africa', isActive: true, popular: false },
    { id: 'zw', name: 'Zimbabwe', code: 'ZW', phoneCode: '+263', flag: '🇿🇼', currency: 'ZWL', currencySymbol: '$', timezone: 'Africa/Harare', region: 'Africa', isActive: true, popular: false },
    { id: 'bw', name: 'Botswana', code: 'BW', phoneCode: '+267', flag: '🇧🇼', currency: 'BWP', currencySymbol: 'P', timezone: 'Africa/Gaborone', region: 'Africa', isActive: true, popular: false },
    { id: 'na', name: 'Namibia', code: 'NA', phoneCode: '+264', flag: '🇳🇦', currency: 'NAD', currencySymbol: 'N$', timezone: 'Africa/Windhoek', region: 'Africa', isActive: true, popular: false },
    { id: 'za', name: 'South Africa', code: 'ZA', phoneCode: '+27', flag: '🇿🇦', currency: 'ZAR', currencySymbol: 'R', timezone: 'Africa/Johannesburg', region: 'Africa', isActive: true, popular: true },
    { id: 'et', name: 'Ethiopia', code: 'ET', phoneCode: '+251', flag: '🇪🇹', currency: 'ETB', currencySymbol: 'Br', timezone: 'Africa/Addis_Ababa', region: 'Africa', isActive: true, popular: false },
    { id: 'sd', name: 'Sudan', code: 'SD', phoneCode: '+249', flag: '🇸🇩', currency: 'SDG', currencySymbol: 'ج.س', timezone: 'Africa/Khartoum', region: 'Africa', isActive: true, popular: false },
    { id: 'eg', name: 'Egypt', code: 'EG', phoneCode: '+20', flag: '🇪🇬', currency: 'EGP', currencySymbol: 'E£', timezone: 'Africa/Cairo', region: 'Africa', isActive: true, popular: true },
    { id: 'ma', name: 'Morocco', code: 'MA', phoneCode: '+212', flag: '🇲🇦', currency: 'MAD', currencySymbol: 'د.م', timezone: 'Africa/Casablanca', region: 'Africa', isActive: true, popular: false },
    { id: 'sn', name: 'Senegal', code: 'SN', phoneCode: '+221', flag: '🇸🇳', currency: 'XOF', currencySymbol: 'CFA', timezone: 'Africa/Dakar', region: 'Africa', isActive: true, popular: false },
    { id: 'ci', name: 'Ivory Coast', code: 'CI', phoneCode: '+225', flag: '🇨🇮', currency: 'XOF', currencySymbol: 'CFA', timezone: 'Africa/Abidjan', region: 'Africa', isActive: true, popular: false },
    { id: 'cm', name: 'Cameroon', code: 'CM', phoneCode: '+237', flag: '🇨🇲', currency: 'XAF', currencySymbol: 'FCFA', timezone: 'Africa/Douala', region: 'Africa', isActive: true, popular: false },
    { id: 'cd', name: 'DR Congo', code: 'CD', phoneCode: '+243', flag: '🇨🇩', currency: 'CDF', currencySymbol: 'FC', timezone: 'Africa/Kinshasa', region: 'Africa', isActive: true, popular: false },
    { id: 'ao', name: 'Angola', code: 'AO', phoneCode: '+244', flag: '🇦🇴', currency: 'AOA', currencySymbol: 'Kz', timezone: 'Africa/Luanda', region: 'Africa', isActive: true, popular: false },
    { id: 'mz', name: 'Mozambique', code: 'MZ', phoneCode: '+258', flag: '🇲🇿', currency: 'MZN', currencySymbol: 'MT', timezone: 'Africa/Maputo', region: 'Africa', isActive: true, popular: false },

    // Europe
    { id: 'uk', name: 'United Kingdom', code: 'GB', phoneCode: '+44', flag: '🇬🇧', currency: 'GBP', currencySymbol: '£', timezone: 'Europe/London', region: 'Europe', isActive: true, popular: true },
    { id: 'de', name: 'Germany', code: 'DE', phoneCode: '+49', flag: '🇩🇪', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Berlin', region: 'Europe', isActive: true, popular: true },
    { id: 'fr', name: 'France', code: 'FR', phoneCode: '+33', flag: '🇫🇷', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Paris', region: 'Europe', isActive: true, popular: true },
    { id: 'it', name: 'Italy', code: 'IT', phoneCode: '+39', flag: '🇮🇹', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Rome', region: 'Europe', isActive: true, popular: false },
    { id: 'es', name: 'Spain', code: 'ES', phoneCode: '+34', flag: '🇪🇸', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Madrid', region: 'Europe', isActive: true, popular: false },
    { id: 'nl', name: 'Netherlands', code: 'NL', phoneCode: '+31', flag: '🇳🇱', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Amsterdam', region: 'Europe', isActive: true, popular: false },
    { id: 'ch', name: 'Switzerland', code: 'CH', phoneCode: '+41', flag: '🇨🇭', currency: 'CHF', currencySymbol: 'CHF', timezone: 'Europe/Zurich', region: 'Europe', isActive: true, popular: false },
    { id: 'se', name: 'Sweden', code: 'SE', phoneCode: '+46', flag: '🇸🇪', currency: 'SEK', currencySymbol: 'kr', timezone: 'Europe/Stockholm', region: 'Europe', isActive: true, popular: false },
    { id: 'no', name: 'Norway', code: 'NO', phoneCode: '+47', flag: '🇳🇴', currency: 'NOK', currencySymbol: 'kr', timezone: 'Europe/Oslo', region: 'Europe', isActive: true, popular: false },
    { id: 'dk', name: 'Denmark', code: 'DK', phoneCode: '+45', flag: '🇩🇰', currency: 'DKK', currencySymbol: 'kr', timezone: 'Europe/Copenhagen', region: 'Europe', isActive: true, popular: false },

    // North America
    { id: 'us', name: 'United States', code: 'US', phoneCode: '+1', flag: '🇺🇸', currency: 'USD', currencySymbol: '$', timezone: 'America/New_York', region: 'North America', isActive: true, popular: true },
    { id: 'ca', name: 'Canada', code: 'CA', phoneCode: '+1', flag: '🇨🇦', currency: 'CAD', currencySymbol: 'C$', timezone: 'America/Toronto', region: 'North America', isActive: true, popular: true },
    { id: 'mx', name: 'Mexico', code: 'MX', phoneCode: '+52', flag: '🇲🇽', currency: 'MXN', currencySymbol: '$', timezone: 'America/Mexico_City', region: 'North America', isActive: true, popular: false },

    // Asia
    { id: 'in', name: 'India', code: 'IN', phoneCode: '+91', flag: '🇮🇳', currency: 'INR', currencySymbol: '₹', timezone: 'Asia/Kolkata', region: 'Asia', isActive: true, popular: true },
    { id: 'cn', name: 'China', code: 'CN', phoneCode: '+86', flag: '🇨🇳', currency: 'CNY', currencySymbol: '¥', timezone: 'Asia/Shanghai', region: 'Asia', isActive: true, popular: true },
    { id: 'jp', name: 'Japan', code: 'JP', phoneCode: '+81', flag: '🇯🇵', currency: 'JPY', currencySymbol: '¥', timezone: 'Asia/Tokyo', region: 'Asia', isActive: true, popular: true },
    { id: 'kr', name: 'South Korea', code: 'KR', phoneCode: '+82', flag: '🇰🇷', currency: 'KRW', currencySymbol: '₩', timezone: 'Asia/Seoul', region: 'Asia', isActive: true, popular: false },
    { id: 'sg', name: 'Singapore', code: 'SG', phoneCode: '+65', flag: '🇸🇬', currency: 'SGD', currencySymbol: 'S$', timezone: 'Asia/Singapore', region: 'Asia', isActive: true, popular: true },
    { id: 'my', name: 'Malaysia', code: 'MY', phoneCode: '+60', flag: '🇲🇾', currency: 'MYR', currencySymbol: 'RM', timezone: 'Asia/Kuala_Lumpur', region: 'Asia', isActive: true, popular: false },
    { id: 'th', name: 'Thailand', code: 'TH', phoneCode: '+66', flag: '🇹🇭', currency: 'THB', currencySymbol: '฿', timezone: 'Asia/Bangkok', region: 'Asia', isActive: true, popular: false },
    { id: 'id', name: 'Indonesia', code: 'ID', phoneCode: '+62', flag: '🇮🇩', currency: 'IDR', currencySymbol: 'Rp', timezone: 'Asia/Jakarta', region: 'Asia', isActive: true, popular: false },
    { id: 'ph', name: 'Philippines', code: 'PH', phoneCode: '+63', flag: '🇵🇭', currency: 'PHP', currencySymbol: '₱', timezone: 'Asia/Manila', region: 'Asia', isActive: true, popular: false },
    { id: 'vn', name: 'Vietnam', code: 'VN', phoneCode: '+84', flag: '🇻🇳', currency: 'VND', currencySymbol: '₫', timezone: 'Asia/Ho_Chi_Minh', region: 'Asia', isActive: true, popular: false },

    // Oceania
    { id: 'au', name: 'Australia', code: 'AU', phoneCode: '+61', flag: '🇦🇺', currency: 'AUD', currencySymbol: 'A$', timezone: 'Australia/Sydney', region: 'Oceania', isActive: true, popular: true },
    { id: 'nz', name: 'New Zealand', code: 'NZ', phoneCode: '+64', flag: '🇳🇿', currency: 'NZD', currencySymbol: 'NZ$', timezone: 'Pacific/Auckland', region: 'Oceania', isActive: true, popular: false },

    // South America
    { id: 'br', name: 'Brazil', code: 'BR', phoneCode: '+55', flag: '🇧🇷', currency: 'BRL', currencySymbol: 'R$', timezone: 'America/Sao_Paulo', region: 'South America', isActive: true, popular: true },
    { id: 'ar', name: 'Argentina', code: 'AR', phoneCode: '+54', flag: '🇦🇷', currency: 'ARS', currencySymbol: '$', timezone: 'America/Argentina/Buenos_Aires', region: 'South America', isActive: true, popular: false },
    { id: 'cl', name: 'Chile', code: 'CL', phoneCode: '+56', flag: '🇨🇱', currency: 'CLP', currencySymbol: '$', timezone: 'America/Santiago', region: 'South America', isActive: true, popular: false },
    { id: 'co', name: 'Colombia', code: 'CO', phoneCode: '+57', flag: '🇨🇴', currency: 'COP', currencySymbol: '$', timezone: 'America/Bogota', region: 'South America', isActive: true, popular: false },
    { id: 'pe', name: 'Peru', code: 'PE', phoneCode: '+51', flag: '🇵🇪', currency: 'PEN', currencySymbol: 'S/', timezone: 'America/Lima', region: 'South America', isActive: true, popular: false }
  ];

  private selectedCountrySubject = new BehaviorSubject<Country | null>(null);
  public selectedCountry$ = this.selectedCountrySubject.asObservable();

  constructor() {
    this.loadUserCountry();
  }

  /**
   * Get all countries
   */
  getAllCountries(): Country[] {
    return this.countries.filter(country => country.isActive);
  }

  /**
   * Get popular countries (for quick selection)
   */
  getPopularCountries(): Country[] {
    return this.countries.filter(country => country.isActive && country.popular);
  }

  /**
   * Get countries by region
   */
  getCountriesByRegion(region: string): Country[] {
    return this.countries.filter(country => country.isActive && country.region === region);
  }

  /**
   * Get country by code
   */
  getCountryByCode(code: string): Country | undefined {
    return this.countries.find(country => country.code === code);
  }

  /**
   * Get country by phone code
   */
  getCountryByPhoneCode(phoneCode: string): Country | undefined {
    return this.countries.find(country => country.phoneCode === phoneCode);
  }

  /**
   * Search countries by name or code
   */
  searchCountries(query: string): Country[] {
    const searchTerm = query.toLowerCase();
    return this.countries.filter(country => 
      country.isActive && (
        country.name.toLowerCase().includes(searchTerm) ||
        country.code.toLowerCase().includes(searchTerm) ||
        country.phoneCode.includes(searchTerm)
      )
    );
  }

  /**
   * Set user's selected country
   */
  setUserCountry(country: Country): void {
    this.selectedCountrySubject.next(country);
    localStorage.setItem('userCountry', JSON.stringify(country));
  }

  /**
   * Get user's selected country
   */
  getUserCountry(): Country | null {
    return this.selectedCountrySubject.value;
  }

  /**
   * Load user's country from storage
   */
  private loadUserCountry(): void {
    const stored = localStorage.getItem('userCountry');
    if (stored) {
      try {
        const country = JSON.parse(stored);
        this.selectedCountrySubject.next(country);
      } catch (error) {
        console.error('Error loading user country:', error);
      }
    }
  }

  /**
   * Get default country (Nigeria for African users, US for others)
   */
  getDefaultCountry(): Country {
    const userCountry = this.getUserCountry();
    if (userCountry) {
      return userCountry;
    }
    
    // Default to Nigeria for African context
    return this.getCountryByCode('NG') || this.countries[0];
  }

  /**
   * Clear user's country selection
   */
  clearUserCountry(): void {
    this.selectedCountrySubject.next(null);
    localStorage.removeItem('userCountry');
  }

  /**
   * Get countries for registration (popular + region-based)
   */
  getCountriesForRegistration(): Country[] {
    const popular = this.getPopularCountries();
    const userRegion = this.detectUserRegion();
    const regional = this.getCountriesByRegion(userRegion);
    
    // Combine popular with regional, removing duplicates
    const combined = [...popular];
    regional.forEach(country => {
      if (!combined.find(c => c.id === country.id)) {
        combined.push(country);
      }
    });
    
    return combined.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Detect user's region based on timezone
   */
  private detectUserRegion(): string {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone.includes('Africa')) return 'Africa';
      if (timezone.includes('Europe')) return 'Europe';
      if (timezone.includes('America')) return 'North America';
      if (timezone.includes('Asia')) return 'Asia';
      if (timezone.includes('Australia') || timezone.includes('Pacific')) return 'Oceania';
      return 'Africa'; // Default to Africa for Lidapay
    } catch {
      return 'Africa';
    }
  }
}
