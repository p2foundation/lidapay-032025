import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PhoneValidationService {

  constructor() { }

  /**
   * Validates if a phone number is a valid Ghana phone number
   * Supports formats: +233XXXXXXXXX, 233XXXXXXXXX, 0XXXXXXXXX, XXXXXXXXX
   */
  isValidGhanaPhoneNumber(phoneNumber: string): boolean {
    if (!phoneNumber) return false;

    // Remove all non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Ghana phone number patterns:
    // +233XXXXXXXXX (13 digits starting with 233)
    // 233XXXXXXXXX (12 digits starting with 233)
    // 0XXXXXXXXX (10 digits starting with 0)
    // XXXXXXXXX (9 digits - local format)
    
    if (cleanNumber.length === 13 && cleanNumber.startsWith('233')) {
      // +233XXXXXXXXX format
      return this.isValidGhanaPrefix(cleanNumber.slice(3));
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith('233')) {
      // 233XXXXXXXXX format
      return this.isValidGhanaPrefix(cleanNumber.slice(3));
    } else if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
      // 0XXXXXXXXX format
      return this.isValidGhanaPrefix(cleanNumber.slice(1));
    } else if (cleanNumber.length === 9) {
      // XXXXXXXXX format (local)
      return this.isValidGhanaPrefix(cleanNumber);
    }
    
    return false;
  }

  /**
   * Validates if the 9-digit number has a valid Ghana mobile prefix
   */
  private isValidGhanaPrefix(nineDigitNumber: string): boolean {
    if (nineDigitNumber.length !== 9) return false;
    
    // Updated valid Ghana mobile prefixes (2025) - STRICTLY ENFORCED
    const validPrefixes = [
      '20', '24', '26', '27', // MTN Ghana
      '54', '55', '56', '57'  // AirtelTigo Ghana
    ];
    
    const prefix = nineDigitNumber.substring(0, 2);
    const isValid = validPrefixes.includes(prefix);
    
    console.log(`Ghana prefix validation: ${prefix} -> ${isValid ? 'VALID' : 'INVALID'}`);
    return isValid;
  }

  /**
   * Formats a Ghana phone number to a consistent format
   * Returns: +233XXXXXXXXX
   */
  formatGhanaPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    let formattedNumber = '';
    
    if (cleanNumber.length === 13 && cleanNumber.startsWith('233')) {
      // Already in +233XXXXXXXXX format
      formattedNumber = cleanNumber;
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith('233')) {
      // 233XXXXXXXXX format
      formattedNumber = cleanNumber;
    } else if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
      // 0XXXXXXXXX format - convert to 233XXXXXXXXX
      formattedNumber = '233' + cleanNumber.slice(1);
    } else if (cleanNumber.length === 9) {
      // XXXXXXXXX format (local) - convert to 233XXXXXXXXX
      formattedNumber = '233' + cleanNumber;
    } else {
      // Invalid format, return original
      return phoneNumber;
    }
    
    // Add + prefix
    return '+' + formattedNumber;
  }

  /**
   * Formats a Ghana phone number to local format (0XXXXXXXXX)
   */
  formatGhanaPhoneNumberLocal(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    let localNumber = '';
    
    if (cleanNumber.length === 13 && cleanNumber.startsWith('233')) {
      // +233XXXXXXXXX format - convert to 0XXXXXXXXX
      const nineDigitNumber = cleanNumber.slice(3);
      if (this.isValidGhanaPrefix(nineDigitNumber)) {
        localNumber = '0' + nineDigitNumber;
      } else {
        console.log('Invalid Ghana prefix in 13-digit format:', nineDigitNumber);
        return phoneNumber; // Return original if invalid
      }
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith('233')) {
      // 233XXXXXXXXX format - convert to 0XXXXXXXXX
      const nineDigitNumber = cleanNumber.slice(3);
      if (this.isValidGhanaPrefix(nineDigitNumber)) {
        localNumber = '0' + nineDigitNumber;
      } else {
        console.log('Invalid Ghana prefix in 12-digit format:', nineDigitNumber);
        return phoneNumber; // Return original if invalid
      }
    } else if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
      // Already in 0XXXXXXXXX format - validate the prefix
      const nineDigitNumber = cleanNumber.slice(1);
      if (this.isValidGhanaPrefix(nineDigitNumber)) {
        localNumber = cleanNumber;
      } else {
        console.log('Invalid Ghana prefix in 10-digit format:', nineDigitNumber);
        return phoneNumber; // Return original if invalid
      }
    } else if (cleanNumber.length === 9) {
      // XXXXXXXXX format (local) - validate and convert to 0XXXXXXXXX
      if (this.isValidGhanaPrefix(cleanNumber)) {
        localNumber = '0' + cleanNumber;
      } else {
        console.log('Invalid Ghana prefix in 9-digit format:', cleanNumber);
        return phoneNumber; // Return original if invalid
      }
    } else {
      // Invalid format, return original
      console.log('Invalid Ghana phone number format:', cleanNumber);
      return phoneNumber;
    }
    
    console.log(`Ghana phone number formatted to local: ${phoneNumber} -> ${localNumber}`);
    return localNumber;
  }

  /**
   * Gets the network provider for a Ghana phone number
   */
  getGhanaNetworkProvider(phoneNumber: string): string {
    if (!this.isValidGhanaPhoneNumber(phoneNumber)) return 'Unknown';
    
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    let nineDigitNumber = '';
    
    if (cleanNumber.length === 13 && cleanNumber.startsWith('233')) {
      nineDigitNumber = cleanNumber.slice(3);
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith('233')) {
      nineDigitNumber = cleanNumber.slice(3);
    } else if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
      nineDigitNumber = cleanNumber.slice(1);
    } else if (cleanNumber.length === 9) {
      nineDigitNumber = cleanNumber;
    }
    
    if (nineDigitNumber.length !== 9) return 'Unknown';
    
    const prefix = nineDigitNumber.substring(0, 2);
    
    // MTN Ghana (2025)
    if (['20', '24', '26', '27'].includes(prefix)) {
      return 'MTN';
    }
    
    // AirtelTigo Ghana (2025)
    if (['55', '56'].includes(prefix)) {
      return 'AirtelTigo';
    }
    
    return 'Unknown';
  }

  /**
   * Sanitizes a phone number by removing all non-numeric characters
   * This helps prevent issues with appended characters like 'o', spaces, dashes, etc.
   */
  sanitizePhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters (letters, spaces, dashes, parentheses, etc.)
    return phoneNumber.replace(/\D/g, '');
  }

  /**
   * Validates and formats a phone number, returning both validation result and formatted number
   */
  validateAndFormatGhanaPhoneNumber(phoneNumber: string): {
    isValid: boolean;
    formatted: string;
    local: string;
    network: string;
    error?: string;
  } {
    if (!phoneNumber) {
      return {
        isValid: false,
        formatted: '',
        local: '',
        network: 'Unknown',
        error: 'Phone number is required'
      };
    }

    // First sanitize the phone number to remove any non-numeric characters
    const sanitizedNumber = this.sanitizePhoneNumber(phoneNumber);
    
    if (sanitizedNumber !== phoneNumber) {
      console.log(`Phone number sanitized: "${phoneNumber}" -> "${sanitizedNumber}"`);
    }

    const isValid = this.isValidGhanaPhoneNumber(sanitizedNumber);
    
    if (!isValid) {
      return {
        isValid: false,
        formatted: sanitizedNumber,
        local: sanitizedNumber,
        network: 'Unknown',
        error: `Invalid Ghana phone number format. Valid prefixes: 020, 024, 026, 027, 055, 056`
      };
    }

    const formatted = this.formatGhanaPhoneNumber(sanitizedNumber);
    const local = this.formatGhanaPhoneNumberLocal(sanitizedNumber);
    const network = this.getGhanaNetworkProvider(sanitizedNumber);

    return {
      isValid: true,
      formatted,
      local,
      network,
      error: undefined
    };
  }

  /**
   * Pre-payment validation for Ghana phone numbers
   * This should be called BEFORE processing any payment to prevent invalid transactions
   */
  validateGhanaPhoneNumberForPayment(phoneNumber: string): {
    isValid: boolean;
    sanitized: string;
    formatted: string;
    local: string;
    network: string;
    error?: string;
    warning?: string;
  } {
    if (!phoneNumber) {
      return {
        isValid: false,
        sanitized: '',
        formatted: '',
        local: '',
        network: 'Unknown',
        error: 'Phone number is required for payment'
      };
    }

    // Sanitize the phone number
    const sanitizedNumber = this.sanitizePhoneNumber(phoneNumber);
    
    // Check if sanitization was needed
    let warning = '';
    if (sanitizedNumber !== phoneNumber) {
      warning = `Phone number sanitized from "${phoneNumber}" to "${sanitizedNumber}"`;
      console.log(warning);
    }

    // Validate the sanitized number
    const validation = this.validateAndFormatGhanaPhoneNumber(sanitizedNumber);
    
    if (!validation.isValid) {
      return {
        isValid: false,
        sanitized: sanitizedNumber,
        formatted: sanitizedNumber,
        local: sanitizedNumber,
        network: 'Unknown',
        error: validation.error,
        warning: warning || undefined
      };
    }

    return {
      isValid: true,
      sanitized: sanitizedNumber,
      formatted: validation.formatted,
      local: validation.local,
      network: validation.network,
      warning: warning || undefined
    };
  }
}
