import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment.prod';
import { ReloadlyService } from './reloadly.service';
import { AirtimeService } from './one4all/airtime.service';

export interface Country {
  isoName: string;
  name: string;
  currencyCode: string;
  currencyName: string;
  flag: string;
  callingCodes: string[];
}

export interface Operator {
  id: number;
  name: string;
  country: string;
  currency: string;
  logo: string;
  fixedAmounts?: number[];
  localAmounts?: number[];
  internationalAmounts?: number[];
}

export interface AirtimeRequest {
  recipientNumber: string;
  amount: number;
  countryIso: string;
  operatorId?: number;
  autoDetect?: boolean;
  description?: string;
}

export interface AirtimeResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  provider: 'reloadly' | 'one4all';
  checkoutUrl?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EnhancedAirtimeService {
  private apiUrl = environment.baseURL;
  
  // Ghana country code for routing logic
  private readonly GHANA_ISO = 'GH';
  private readonly GHANA_PHONE_PREFIX = '233';

  constructor(
    private http: HttpClient,
    private reloadlyService: ReloadlyService,
    private one4allService: AirtimeService
  ) {}

  /**
   * Get all available countries for airtime topup
   */
  getCountries(): Observable<Country[]> {
    return this.reloadlyService.getReloadlyCountries().pipe(
      map((response: any) => {
        console.log('EnhancedAirtimeService - Raw response:', response);
        if (response && Array.isArray(response)) {
          const countries = response.map((country: any) => {
            console.log('Processing country:', country);
            return {
              isoName: country.isoName,
              name: country.name,
              currencyCode: country.currencyCode,
              currencyName: country.currencyName,
              flag: country.flag,
              callingCodes: country.callingCodes || []
            };
          });
          console.log('Processed countries:', countries);
          return countries;
        }
        console.log('EnhancedAirtimeService - No valid response data');
        return [];
      }),
      catchError(error => {
        console.error('Error fetching countries:', error);
        return throwError(() => new Error('Failed to load countries'));
      })
    );
  }

  /**
   * Get operators for a specific country
   */
  getOperators(countryIso: string): Observable<Operator[]> {
    // For Ghana, return local operators
    if (countryIso === this.GHANA_ISO) {
      return this.getGhanaOperators();
    }
    
    // For other countries, use Reloadly
    return this.reloadlyService.getOperators(countryIso).pipe(
      map((response: any) => {
        console.log('EnhancedAirtimeService - Operators response:', response);
        if (response && Array.isArray(response)) {
          return response.map((operator: any) => ({
            id: operator.id,
            name: operator.name,
            country: operator.country,
            currency: operator.currency,
            logo: operator.logo,
            fixedAmounts: operator.fixedAmounts,
            localAmounts: operator.localAmounts,
            internationalAmounts: operator.internationalAmounts
          }));
        } else if (response && response.data && Array.isArray(response.data)) {
          return response.data.map((operator: any) => ({
            id: operator.id,
            name: operator.name,
            country: operator.country,
            currency: operator.currency,
            logo: operator.logo,
            fixedAmounts: operator.fixedAmounts,
            localAmounts: operator.localAmounts,
            internationalAmounts: operator.internationalAmounts
          }));
        }
        console.log('EnhancedAirtimeService - No valid operators data');
        return [];
      }),
      catchError(error => {
        console.error('Error fetching operators:', error);
        return throwError(() => new Error('Failed to load operators'));
      })
    );
  }

  /**
   * Auto-detect operator based on phone number
   */
  autoDetectOperator(phoneNumber: string, countryIso: string): Observable<Operator> {
    const params = {
      phone: phoneNumber,
      countryIsoCode: countryIso
    };

    // For Ghana numbers, use local detection
    if (countryIso === this.GHANA_ISO || phoneNumber.startsWith(this.GHANA_PHONE_PREFIX)) {
      return this.autoDetectGhanaOperator(phoneNumber);
    }

    // For international numbers, use Reloadly
    return this.reloadlyService.autoDetectOperator(params).pipe(
      map((response: any) => {
        console.log('EnhancedAirtimeService - Auto detect response:', response);
        if (response && response.data) {
          return {
            id: response.data.id,
            name: response.data.name,
            country: response.data.country,
            currency: response.data.currency,
            logo: response.data.logo
          };
        } else if (response && response.id) {
          return {
            id: response.id,
            name: response.name,
            country: response.country,
            currency: response.currency,
            logo: response.logo
          };
        }
        throw new Error('No operator found');
      }),
      catchError(error => {
        console.error('Error auto-detecting operator:', error);
        return throwError(() => new Error('Failed to detect operator'));
      })
    );
  }

  /**
   * Submit airtime purchase request
   */
  submitAirtime(request: AirtimeRequest): Observable<AirtimeResponse> {
    // Validate request
    if (!request.recipientNumber || !request.amount || !request.countryIso) {
      return throwError(() => new Error('Missing required fields'));
    }

    // Route to appropriate service based on country
    if (request.countryIso === this.GHANA_ISO) {
      return this.submitGhanaAirtime(request);
    } else {
      return this.submitInternationalAirtime(request);
    }
  }

  /**
   * Get Ghana-specific operators
   */
  private getGhanaOperators(): Observable<Operator[]> {
    const ghanaOperators: Operator[] = [
      {
        id: 4,
        name: 'MTN Ghana',
        country: 'GH',
        currency: 'GHS',
        logo: 'assets/imgs/operators/mtn.png',
        fixedAmounts: [5, 10, 20, 50, 100, 200, 500]
      },
      {
        id: 6,
        name: 'Telecel Ghana',
        country: 'GH',
        currency: 'GHS',
        logo: 'assets/imgs/operators/telecel.png',
        fixedAmounts: [5, 10, 20, 50, 100, 200, 500]
      },
      {
        id: 1,
        name: 'AirtelTigo Ghana',
        country: 'GH',
        currency: 'GHS',
        logo: 'assets/imgs/operators/airteltigo.png',
        fixedAmounts: [5, 10, 20, 50, 100, 200, 500]
      },
      {
        id: 3,
        name: 'Glo Ghana',
        country: 'GH',
        currency: 'GHS',
        logo: 'assets/imgs/operators/glo.png',
        fixedAmounts: [5, 10, 20, 50, 100, 200, 500]
      },
      {
        id: 5,
        name: 'Busy Ghana',
        country: 'GH',
        currency: 'GHS',
        logo: 'assets/imgs/operators/busy.png',
        fixedAmounts: [5, 10, 20, 50, 100, 200, 500]
      },
      {
        id: 7,
        name: 'Surfline Ghana',
        country: 'GH',
        currency: 'GHS',
        logo: 'assets/imgs/operators/surfline.png',
        fixedAmounts: [5, 10, 20, 50, 100, 200, 500]
      }
    ];

    return of(ghanaOperators);
  }

  /**
   * Auto-detect Ghana operator based on phone number
   */
  private autoDetectGhanaOperator(phoneNumber: string): Observable<Operator> {
    // Remove country code if present
    let cleanNumber = phoneNumber.replace(/^\+233/, '').replace(/^233/, '');
    
    // Ghana operator detection logic
    let operatorId: number;
    
    if (cleanNumber.startsWith('24') || cleanNumber.startsWith('54') || cleanNumber.startsWith('55') || 
        cleanNumber.startsWith('59') || cleanNumber.startsWith('25')) {
      operatorId = 4; // MTN
    } else if (cleanNumber.startsWith('20') || cleanNumber.startsWith('50')) {
      operatorId = 1; // AirtelTigo
    } else if (cleanNumber.startsWith('27') || cleanNumber.startsWith('57')) {
      operatorId = 6; // Telecel
    } else if (cleanNumber.startsWith('23') || cleanNumber.startsWith('24') || cleanNumber.startsWith('25') ||
               cleanNumber.startsWith('26') || cleanNumber.startsWith('27') || cleanNumber.startsWith('28') ||
               cleanNumber.startsWith('29')) {
      operatorId = 3; // Glo
    } else if (cleanNumber.startsWith('26') || cleanNumber.startsWith('56')) {
      operatorId = 5; // Busy
    } else if (cleanNumber.startsWith('28') || cleanNumber.startsWith('58')) {
      operatorId = 7; // Surfline
    } else {
      return throwError(() => new Error('Unable to detect operator for this number'));
    }

    return this.getGhanaOperators().pipe(
      map(operators => operators.find(op => op.id === operatorId)),
      map(operator => {
        if (!operator) {
          throw new Error('Operator not found');
        }
        return operator;
      })
    );
  }

  /**
   * Submit airtime for Ghana (One4All)
   */
  private submitGhanaAirtime(request: AirtimeRequest): Observable<AirtimeResponse> {
    const airtimeData = {
      recipientNumber: request.recipientNumber,
      amount: request.amount,
      network: request.operatorId || 0, // 0 for auto-detect
      description: request.description || `Airtime recharge for ${request.recipientNumber}`
    };

    return this.one4allService.buyAirtimeTopup(airtimeData).pipe(
      map((response: any) => ({
        success: true,
        transactionId: response.transactionId || response.id,
        message: 'Airtime purchase initiated successfully',
        provider: 'one4all' as const,
        checkoutUrl: response.checkoutUrl
      })),
      catchError(error => {
        console.error('Ghana airtime error:', error);
        return of({
          success: false,
          message: 'Failed to process airtime purchase',
          provider: 'one4all' as const,
          error: error.message || 'Unknown error'
        });
      })
    );
  }

  /**
   * Submit airtime for international (Reloadly)
   */
  private submitInternationalAirtime(request: AirtimeRequest): Observable<AirtimeResponse> {
    const reloadlyData = {
      recipientNumber: request.recipientNumber,
      amount: request.amount,
      operatorId: request.operatorId,
      countryIso: request.countryIso,
      autoDetect: request.autoDetect || false,
      description: request.description || `International airtime for ${request.recipientNumber}`
    };

    return this.reloadlyService.submitAirtime(reloadlyData).pipe(
      map((response: any) => ({
        success: true,
        transactionId: response.transactionId || response.id,
        message: 'International airtime purchase initiated successfully',
        provider: 'reloadly' as const,
        checkoutUrl: response.checkoutUrl
      })),
      catchError(error => {
        console.error('International airtime error:', error);
        return of({
          success: false,
          message: 'Failed to process international airtime purchase',
          provider: 'reloadly' as const,
          error: error.message || 'Unknown error'
        });
      })
    );
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string, countryIso: string): boolean {
    if (!phoneNumber) return false;

    // Remove all non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    if (countryIso === this.GHANA_ISO) {
      // Ghana number validation: 
      // - 9 digits (244588584)
      // - 10 digits starting with 0 (0244588584)
      // - 12 digits starting with 233 (233244588584)
      return (cleanNumber.length === 9) || 
             (cleanNumber.length === 10 && cleanNumber.startsWith('0')) ||
             (cleanNumber.length === 12 && cleanNumber.startsWith('233'));
    } else {
      // International number validation (minimum 7 digits, maximum 15)
      return cleanNumber.length >= 7 && cleanNumber.length <= 15;
    }
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phoneNumber: string, countryIso: string): string {
    if (!phoneNumber) return '';

    const cleanNumber = phoneNumber.replace(/\D/g, '');

    if (countryIso === this.GHANA_ISO) {
      // Format Ghana numbers for display
      if (cleanNumber.length === 9) {
        // 9 digits: 244588584 -> +233 244 588 584
        return `+233 ${cleanNumber.slice(0, 3)} ${cleanNumber.slice(3, 6)} ${cleanNumber.slice(6)}`;
      } else if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
        // 10 digits starting with 0: 0244588584 -> +233 244 588 584
        return `+233 ${cleanNumber.slice(1, 4)} ${cleanNumber.slice(4, 7)} ${cleanNumber.slice(7)}`;
      } else if (cleanNumber.length === 12 && cleanNumber.startsWith('233')) {
        // 12 digits starting with 233: 233244588584 -> +233 244 588 584
        return `+233 ${cleanNumber.slice(3, 6)} ${cleanNumber.slice(6, 9)} ${cleanNumber.slice(9)}`;
      } else if (cleanNumber.length >= 7) {
        // For any other valid length, format as international
        return `+${cleanNumber}`;
      }
      // Return as is for short numbers
      return phoneNumber;
    }

    // Default international formatting
    return `+${cleanNumber}`;
  }

  /**
   * Format phone number for API calls (no spaces, proper format)
   */
  formatPhoneNumberForAPI(phoneNumber: string, countryIso: string): string {
    if (!phoneNumber) return '';

    const cleanNumber = phoneNumber.replace(/\D/g, '');

    if (countryIso === this.GHANA_ISO) {
      // For Ghana: use local format (like 0240000000) for Prymo API
      if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
        // Keep as is: 0244588584 (perfect for Prymo API)
        return cleanNumber;
      } else if (cleanNumber.length === 9) {
        // Convert 244588584 -> 0244588584 (for Prymo API)
        return `0${cleanNumber}`;
      } else if (cleanNumber.length === 12 && cleanNumber.startsWith('233')) {
        // Convert 233244588584 -> 0244588584 (for Prymo API)
        return `0${cleanNumber.slice(3)}`;
      }
      // Return as is for other cases
      return cleanNumber;
    } else {
      // For international: ensure it has + prefix for Reloadly API
      if (cleanNumber.startsWith('233')) {
        return `+${cleanNumber}`;
      } else if (!cleanNumber.startsWith('+')) {
        return `+${cleanNumber}`;
      }
      return cleanNumber;
    }
  }
} 