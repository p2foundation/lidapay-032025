import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface EnhancedOperator {
  id: string;
  name: string;
  displayName: string;
  countryCode: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  supportedServices: OperatorService[];
  fixedAmounts: number[];
  dataBundles: DataBundle[];
  isActive: boolean;
  popularity: number; // 1-10 scale
  website?: string;
  customerCare?: string;
}

export interface OperatorService {
  type: 'airtime' | 'data' | 'sms' | 'international';
  isSupported: boolean;
  description?: string;
}

export interface DataBundle {
  id: string;
  name: string;
  data: string; // e.g., "1GB", "500MB"
  validity: string; // e.g., "30 days", "7 days"
  price: number;
  currency: string;
  isPopular: boolean;
  features?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EnhancedOperatorService {

  private operators: EnhancedOperator[] = [
    // Ghana Operators
    {
      id: 'mtn-gh',
      name: 'MTN',
      displayName: 'MTN Ghana',
      countryCode: 'GH',
      logo: 'assets/imgs/operators/mtn.png',
      primaryColor: '#FFC107',
      secondaryColor: '#FF9800',
      supportedServices: [
        { type: 'airtime', isSupported: true, description: 'Airtime top-up' },
        { type: 'data', isSupported: true, description: 'Data bundles' },
        { type: 'sms', isSupported: true, description: 'SMS packages' },
        { type: 'international', isSupported: true, description: 'International services' }
      ],
      fixedAmounts: [1, 5, 10, 20, 50, 100, 200],
      dataBundles: [
        { id: 'mtn-1gb', name: '1GB Daily', data: '1GB', validity: '24 hours', price: 5, currency: 'GHS', isPopular: true, features: ['4G/5G', 'Night bonus'] },
        { id: 'mtn-2gb', name: '2GB Weekly', data: '2GB', validity: '7 days', price: 15, currency: 'GHS', isPopular: true, features: ['4G/5G', 'Social media bonus'] },
        { id: 'mtn-5gb', name: '5GB Monthly', data: '5GB', validity: '30 days', price: 50, currency: 'GHS', isPopular: false, features: ['4G/5G', 'Unlimited WhatsApp'] }
      ],
      isActive: true,
      popularity: 9,
      website: 'https://www.mtn.com.gh',
      customerCare: '100'
    },
    {
      id: 'vodafone-gh',
      name: 'Vodafone',
      displayName: 'Vodafone Ghana',
      countryCode: 'GH',
      logo: 'assets/imgs/operators/vodafone.png',
      primaryColor: '#E60000',
      secondaryColor: '#FF0000',
      supportedServices: [
        { type: 'airtime', isSupported: true, description: 'Airtime top-up' },
        { type: 'data', isSupported: true, description: 'Data bundles' },
        { type: 'sms', isSupported: true, description: 'SMS packages' },
        { type: 'international', isSupported: true, description: 'International services' }
      ],
      fixedAmounts: [1, 5, 10, 20, 50, 100, 200],
      dataBundles: [
        { id: 'vodafone-500mb', name: '500MB Daily', data: '500MB', validity: '24 hours', price: 3, currency: 'GHS', isPopular: true, features: ['4G/5G', 'Social bonus'] },
        { id: 'vodafone-1gb', name: '1GB Weekly', data: '1GB', validity: '7 days', price: 10, currency: 'GHS', isPopular: true, features: ['4G/5G', 'Night bonus'] },
        { id: 'vodafone-3gb', name: '3GB Monthly', data: '3GB', validity: '30 days', price: 30, currency: 'GHS', isPopular: false, features: ['4G/5G', 'Unlimited calls'] }
      ],
      isActive: true,
      popularity: 8,
      website: 'https://www.vodafone.com.gh',
      customerCare: '050'
    },
    {
      id: 'airteltigo-gh',
      name: 'AirtelTigo',
      displayName: 'AirtelTigo Ghana',
      countryCode: 'GH',
      logo: 'assets/imgs/operators/airteltigo.png',
      primaryColor: '#FF6B35',
      secondaryColor: '#FF8C42',
      supportedServices: [
        { type: 'airtime', isSupported: true, description: 'Airtime top-up' },
        { type: 'data', isSupported: true, description: 'Data bundles' },
        { type: 'sms', isSupported: true, description: 'SMS packages' },
        { type: 'international', isSupported: true, description: 'International services' }
      ],
      fixedAmounts: [1, 5, 10, 20, 50, 100, 200],
      dataBundles: [
        { id: 'airteltigo-1gb', name: '1GB Daily', data: '1GB', validity: '24 hours', price: 4, currency: 'GHS', isPopular: true, features: ['4G/5G', 'Social bonus'] },
        { id: 'airteltigo-2gb', name: '2GB Weekly', data: '2GB', validity: '7 days', price: 12, currency: 'GHS', isPopular: true, features: ['4G/5G', 'Night bonus'] },
        { id: 'airteltigo-4gb', name: '4GB Monthly', data: '4GB', validity: '30 days', price: 40, currency: 'GHS', isPopular: false, features: ['4G/5G', 'Unlimited SMS'] }
      ],
      isActive: true,
      popularity: 7,
      website: 'https://www.airteltigo.com.gh',
      customerCare: '100'
    },
    {
      id: 'glo-gh',
      name: 'Glo',
      displayName: 'Glo Ghana',
      countryCode: 'GH',
      logo: 'assets/imgs/operators/glo.png',
      primaryColor: '#00FF00',
      secondaryColor: '#32CD32',
      supportedServices: [
        { type: 'airtime', isSupported: true, description: 'Airtime top-up' },
        { type: 'data', isSupported: true, description: 'Data bundles' },
        { type: 'sms', isSupported: true, description: 'SMS packages' },
        { type: 'international', isSupported: false, description: 'Limited international services' }
      ],
      fixedAmounts: [1, 5, 10, 20, 50, 100, 200],
      dataBundles: [
        { id: 'glo-1gb', name: '1GB Daily', data: '1GB', validity: '24 hours', price: 4, currency: 'GHS', isPopular: true, features: ['4G/5G', 'Social bonus'] },
        { id: 'glo-2gb', name: '2GB Weekly', data: '2GB', validity: '7 days', price: 12, currency: 'GHS', isPopular: true, features: ['4G/5G', 'Night bonus'] },
        { id: 'glo-3gb', name: '3GB Monthly', data: '3GB', validity: '30 days', price: 35, currency: 'GHS', isPopular: false, features: ['4G/5G', 'Unlimited calls'] }
      ],
      isActive: true,
      popularity: 6,
      website: 'https://www.gloworld.com/gh',
      customerCare: '121'
    },
    {
      id: 'surfline-gh',
      name: 'Surfline',
      displayName: 'Surfline Ghana',
      countryCode: 'GH',
      logo: 'assets/imgs/operators/surfline.png',
      primaryColor: '#2196F3',
      secondaryColor: '#64B5F6',
      supportedServices: [
        { type: 'airtime', isSupported: false, description: 'Data-only provider' },
        { type: 'data', isSupported: true, description: 'Data bundles' },
        { type: 'sms', isSupported: false, description: 'Data-only provider' },
        { type: 'international', isSupported: false, description: 'Data-only provider' }
      ],
      fixedAmounts: [10, 20, 50, 100, 200, 500],
      dataBundles: [
        { id: 'surfline-2gb', name: '2GB Daily', data: '2GB', validity: '24 hours', price: 8, currency: 'GHS', isPopular: true, features: ['4G/5G', 'High speed'] },
        { id: 'surfline-5gb', name: '5GB Weekly', data: '5GB', validity: '7 days', price: 25, currency: 'GHS', isPopular: true, features: ['4G/5G', 'Unlimited streaming'] },
        { id: 'surfline-10gb', name: '10GB Monthly', data: '10GB', validity: '30 days', price: 80, currency: 'GHS', isPopular: false, features: ['4G/5G', 'Premium support'] }
      ],
      isActive: true,
      popularity: 5,
      website: 'https://www.surflinegh.com',
      customerCare: '0800 900 900'
    },
    {
      id: 'busy-gh',
      name: 'Busy',
      displayName: 'Busy Internet Ghana',
      countryCode: 'GH',
      logo: 'assets/imgs/operators/busy.png',
      primaryColor: '#9C27B0',
      secondaryColor: '#BA68C8',
      supportedServices: [
        { type: 'airtime', isSupported: false, description: 'Data-only provider' },
        { type: 'data', isSupported: true, description: 'Data bundles' },
        { type: 'sms', isSupported: false, description: 'Data-only provider' },
        { type: 'international', isSupported: false, description: 'Data-only provider' }
      ],
      fixedAmounts: [10, 20, 50, 100, 200, 500],
      dataBundles: [
        { id: 'busy-1gb', name: '1GB Daily', data: '1GB', validity: '24 hours', price: 5, currency: 'GHS', isPopular: true, features: ['4G/5G', 'Social bonus'] },
        { id: 'busy-3gb', name: '3GB Weekly', data: '3GB', validity: '7 days', price: 18, currency: 'GHS', isPopular: true, features: ['4G/5G', 'Night bonus'] },
        { id: 'busy-6gb', name: '6GB Monthly', data: '6GB', validity: '30 days', price: 60, currency: 'GHS', isPopular: false, features: ['4G/5G', 'Unlimited streaming'] }
      ],
      isActive: true,
      popularity: 4,
      website: 'https://www.busy.com.gh',
      customerCare: '0800 900 900'
    },

    // Nigeria Operators
    {
      id: 'mtn-ng',
      name: 'MTN',
      displayName: 'MTN Nigeria',
      countryCode: 'NG',
      logo: 'assets/imgs/operators/mtn.png',
      primaryColor: '#FFC107',
      secondaryColor: '#FF9800',
      supportedServices: [
        { type: 'airtime', isSupported: true, description: 'Airtime top-up' },
        { type: 'data', isSupported: true, description: 'Data bundles' },
        { type: 'sms', isSupported: true, description: 'SMS packages' },
        { type: 'international', isSupported: true, description: 'International services' }
      ],
      fixedAmounts: [100, 200, 500, 1000, 2000, 5000],
      dataBundles: [
        { id: 'mtn-ng-1gb', name: '1GB Daily', data: '1GB', validity: '24 hours', price: 200, currency: 'NGN', isPopular: true, features: ['4G/5G', 'Night bonus'] },
        { id: 'mtn-ng-2gb', name: '2GB Weekly', data: '2GB', validity: '7 days', price: 500, currency: 'NGN', isPopular: true, features: ['4G/5G', 'Social media bonus'] },
        { id: 'mtn-ng-5gb', name: '5GB Monthly', data: '5GB', validity: '30 days', price: 1500, currency: 'NGN', isPopular: false, features: ['4G/5G', 'Unlimited WhatsApp'] }
      ],
      isActive: true,
      popularity: 9,
      website: 'https://www.mtn.ng',
      customerCare: '180'
    },
    {
      id: 'airtel-ng',
      name: 'Airtel',
      displayName: 'Airtel Nigeria',
      countryCode: 'NG',
      logo: 'assets/imgs/operators/airtel.png',
      primaryColor: '#FF0000',
      secondaryColor: '#FF4444',
      supportedServices: [
        { type: 'airtime', isSupported: true, description: 'Airtime top-up' },
        { type: 'data', isSupported: true, description: 'Data bundles' },
        { type: 'sms', isSupported: true, description: 'SMS packages' },
        { type: 'international', isSupported: true, description: 'International services' }
      ],
      fixedAmounts: [100, 200, 500, 1000, 2000, 5000],
      dataBundles: [
        { id: 'airtel-ng-1gb', name: '1GB Daily', data: '1GB', validity: '24 hours', price: 200, currency: 'NGN', isPopular: true, features: ['4G/5G', 'Social bonus'] },
        { id: 'airtel-ng-2gb', name: '2GB Weekly', data: '2GB', validity: '7 days', price: 500, currency: 'NGN', isPopular: true, features: ['4G/5G', 'Night bonus'] },
        { id: 'airtel-ng-4gb', name: '4GB Monthly', data: '4GB', validity: '30 days', price: 1200, currency: 'NGN', isPopular: false, features: ['4G/5G', 'Unlimited calls'] }
      ],
      isActive: true,
      popularity: 8,
      website: 'https://www.airtel.com.ng',
      customerCare: '111'
    },
    {
      id: 'glo-ng',
      name: 'Glo',
      displayName: 'Glo Nigeria',
      countryCode: 'NG',
      logo: 'assets/imgs/operators/glo.png',
      primaryColor: '#00FF00',
      secondaryColor: '#32CD32',
      supportedServices: [
        { type: 'airtime', isSupported: true, description: 'Airtime top-up' },
        { type: 'data', isSupported: true, description: 'Data bundles' },
        { type: 'sms', isSupported: true, description: 'SMS packages' },
        { type: 'international', isSupported: false, description: 'Limited international services' }
      ],
      fixedAmounts: [100, 200, 500, 1000, 2000, 5000],
      dataBundles: [
        { id: 'glo-ng-1gb', name: '1GB Daily', data: '1GB', validity: '24 hours', price: 200, currency: 'NGN', isPopular: true, features: ['4G/5G', 'Social bonus'] },
        { id: 'glo-ng-2gb', name: '2GB Weekly', data: '2GB', validity: '7 days', price: 500, currency: 'NGN', isPopular: true, features: ['4G/5G', 'Night bonus'] },
        { id: 'glo-ng-3gb', name: '3GB Monthly', data: '3GB', validity: '30 days', price: 1000, currency: 'NGN', isPopular: false, features: ['4G/5G', 'Unlimited calls'] }
      ],
      isActive: true,
      popularity: 7,
      website: 'https://www.gloworld.com/ng',
      customerCare: '121'
    },
    {
      id: '9mobile-ng',
      name: '9mobile',
      displayName: '9mobile Nigeria',
      countryCode: 'NG',
      logo: 'assets/imgs/operators/9mobile.png',
      primaryColor: '#4CAF50',
      secondaryColor: '#81C784',
      supportedServices: [
        { type: 'airtime', isSupported: true, description: 'Airtime top-up' },
        { type: 'data', isSupported: true, description: 'Data bundles' },
        { type: 'sms', isSupported: true, description: 'SMS packages' },
        { type: 'international', isSupported: true, description: 'International services' }
      ],
      fixedAmounts: [100, 200, 500, 1000, 2000, 5000],
      dataBundles: [
        { id: '9mobile-ng-1gb', name: '1GB Daily', data: '1GB', validity: '24 hours', price: 200, currency: 'NGN', isPopular: true, features: ['4G/5G', 'Social bonus'] },
        { id: '9mobile-ng-2gb', name: '2GB Weekly', data: '2GB', validity: '7 days', price: 500, currency: 'NGN', isPopular: true, features: ['4G/5G', 'Night bonus'] },
        { id: '9mobile-ng-4gb', name: '4GB Monthly', data: '4GB', validity: '30 days', price: 1200, currency: 'NGN', isPopular: false, features: ['4G/5G', 'Unlimited SMS'] }
      ],
      isActive: true,
      popularity: 6,
      website: 'https://www.9mobile.com.ng',
      customerCare: '200'
    }
  ];

  constructor() { }

  /**
   * Get all operators for a specific country
   */
  getOperatorsByCountry(countryCode: string): Observable<EnhancedOperator[]> {
    const countryOperators = this.operators.filter(op => 
      op.countryCode === countryCode && op.isActive
    );
    
    // Sort by popularity (highest first)
    countryOperators.sort((a, b) => b.popularity - a.popularity);
    
    return of(countryOperators);
  }

  /**
   * Get operator by ID
   */
  getOperatorById(operatorId: string): Observable<EnhancedOperator | undefined> {
    const operator = this.operators.find(op => op.id === operatorId);
    return of(operator);
  }

  /**
   * Get popular operators for a country
   */
  getPopularOperators(countryCode: string, limit: number = 3): Observable<EnhancedOperator[]> {
    return this.getOperatorsByCountry(countryCode).pipe(
      map(operators => operators.slice(0, limit))
    );
  }

  /**
   * Get operators that support a specific service
   */
  getOperatorsByService(countryCode: string, serviceType: 'airtime' | 'data' | 'sms' | 'international'): Observable<EnhancedOperator[]> {
    return this.getOperatorsByCountry(countryCode).pipe(
      map(operators => operators.filter(op => 
        op.supportedServices.some(service => 
          service.type === serviceType && service.isSupported
        )
      ))
    );
  }

  /**
   * Search operators by name
   */
  searchOperators(countryCode: string, query: string): Observable<EnhancedOperator[]> {
    const searchTerm = query.toLowerCase();
    return this.getOperatorsByCountry(countryCode).pipe(
      map(operators => operators.filter(op => 
        op.name.toLowerCase().includes(searchTerm) ||
        op.displayName.toLowerCase().includes(searchTerm)
      ))
    );
  }

  /**
   * Get data bundles for an operator
   */
  getOperatorDataBundles(operatorId: string): Observable<DataBundle[]> {
    return this.getOperatorById(operatorId).pipe(
      map(operator => operator?.dataBundles || [])
    );
  }

  /**
   * Get fixed amounts for an operator
   */
  getOperatorFixedAmounts(operatorId: string): Observable<number[]> {
    return this.getOperatorById(operatorId).pipe(
      map(operator => operator?.fixedAmounts || [])
    );
  }
}

// Import map operator for the pipe operations
import { map } from 'rxjs/operators';
