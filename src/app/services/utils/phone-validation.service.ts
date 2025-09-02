import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PhoneValidationService {

  // Configuration to control logging
  private enableVerboseLogging = false;

  constructor() { }

  /**
   * Toggle verbose logging on/off
   */
  setVerboseLogging(enabled: boolean): void {
    this.enableVerboseLogging = enabled;
  }

  /**
   * Log message only if verbose logging is enabled
   */
  private log(...args: any[]): void {
    if (this.enableVerboseLogging) {
      console.log(...args);
    }
  }

  /**
   * Validates if a phone number is a valid Ghana phone number
   * Supports formats: +233XXXXXXXXX, 233XXXXXXXXX, 0XXXXXXXXX, XXXXXXXXX
   * REJECTS: 00XXXXXXXXX (11 digits starting with 00) - INVALID FORMAT
   */
  isValidGhanaPhoneNumber(phoneNumber: string): boolean {
    if (!phoneNumber) return false;

    // Remove all non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    this.log(`Validating Ghana phone number: "${phoneNumber}" -> "${cleanNumber}" (length: ${cleanNumber.length})`);
    
    // Check if this is actually a Ghana number (should start with 233)
    if (cleanNumber.startsWith('234')) {
      this.log('INVALID: This appears to be a Nigerian phone number (+234), not Ghana (+233)');
      return false;
    }
    
    // Ghana phone number patterns:
    // +233XXXXXXXXX (13 digits starting with 233)
    // 233XXXXXXXXX (12 digits starting with 233)
    // 0XXXXXXXXX (10 digits starting with 0)
    // XXXXXXXXX (9 digits - local format)
    // REJECT: 00XXXXXXXXX (11 digits starting with 00) - INVALID FORMAT
    
    // First, reject invalid 00 prefix format
    if (cleanNumber.length === 11 && cleanNumber.startsWith('00')) {
      this.log('INVALID: Ghana phone number cannot start with 00 (double zero prefix)');
      return false;
    }
    
    if (cleanNumber.length === 13 && cleanNumber.startsWith('233')) {
      // +233XXXXXXXXX format
      this.log('Validating 13-digit format (233XXXXXXXXX)');
      return this.isValidGhanaPrefix(cleanNumber.slice(3));
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith('233')) {
      // 233XXXXXXXXX format
      this.log('Validating 12-digit format (233XXXXXXXXX)');
      return this.isValidGhanaPrefix(cleanNumber.slice(3));
    } else if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
      // 0XXXXXXXXX format - validate the prefix including the 0
      // For 10-digit numbers, we need to check if the prefix (including 0) is valid
      this.log('Validating 10-digit format (0XXXXXXXXX)');
      return this.isValidGhanaPrefixWithZero(cleanNumber);
    } else if (cleanNumber.length === 9) {
      // XXXXXXXXX format (local)
      this.log('Validating 9-digit format (XXXXXXXXX)');
      return this.isValidGhanaPrefix(cleanNumber);
    }
    
    this.log(`Invalid Ghana phone number format: length ${cleanNumber.length}, starts with: ${cleanNumber.charAt(0)}`);
    return false;
  }

  /**
   * Validates if the 9-digit number has a valid Ghana phone prefix
   * Supports mobile, landline, and special service numbers
   */
  private isValidGhanaPrefix(nineDigitNumber: string): boolean {
    if (nineDigitNumber.length !== 9) return false;
    
    // Complete valid Ghana phone prefixes (2025) - UPDATED with correct MNO codes
    
    // Mobile Network Prefixes (MNOs)
    const mobilePrefixes = [
      '024', '025', '053', '054', '055', '059', // MTN Ghana
      '020', '050', // Telecel Ghana (formerly Vodafone)
      '026', '027', '056', '057'  // AirtelTigo Ghana
    ];
    
    // Landline/Fixed Line Prefixes
    const landlinePrefixes = [
      '021', '022', '023', '028', '029', // Accra, Tema, Kumasi, etc.
      '031', '032', '033', '034', '035', '036', '037', '038', '039', // Other regions
      '040', '041', '042', '043', '044', '045', '046', '047', '048', '049', // Regional centers
      '051', '052', '058', '060', '061', '062', '063', '064', '065', '066', '067', '068', '069' // More regions
    ];
    
    // Special Service Numbers (some may be 3-digit prefixes)
    const specialPrefixes = [
      '080', '081', '082', '083', '084', '085', '086', '087', '088', '089', // Special services
      '090', '091', '092', '093', '094', '095', '096', '097', '098', '099'  // Premium services
    ];
    
    // Combine all valid prefixes
    const validPrefixes = [...mobilePrefixes, ...landlinePrefixes, ...specialPrefixes];
    
    const prefix = nineDigitNumber.substring(0, 3); // Changed from 2 to 3 digits
    const isValid = validPrefixes.includes(prefix);
    
    // Determine phone type for logging
    let phoneType = 'Unknown';
    if (mobilePrefixes.includes(prefix)) {
      phoneType = 'Mobile';
    } else if (landlinePrefixes.includes(prefix)) {
      phoneType = 'Landline';
    } else if (specialPrefixes.includes(prefix)) {
      phoneType = 'Special Service';
    }
    
    this.log(`Ghana prefix validation: ${prefix} -> ${isValid ? 'VALID' : 'INVALID'} (${phoneType})`);
    return isValid;
  }

  /**
   * Validates if a 10-digit number starting with 0 has a valid Ghana phone prefix
   * This method handles the case where we need to validate the prefix including the leading 0
   */
  private isValidGhanaPrefixWithZero(tenDigitNumber: string): boolean {
    if (tenDigitNumber.length !== 10 || !tenDigitNumber.startsWith('0')) return false;
    
    // For 10-digit numbers starting with 0, we validate the first 3 digits (including 0)
    const prefix = tenDigitNumber.substring(0, 3);
    
    this.log(`Validating 10-digit Ghana number: "${tenDigitNumber}", prefix: "${prefix}"`);
    
    // Valid Ghana prefixes for 10-digit numbers (including the leading 0)
    const validPrefixes = [
      '020', '024', '025', '026', '027', '030', '050', '053', '054', '055', '056', '057', '059', // Mobile
      '021', '022', '023', '028', '029', '031', '032', '033', '034', '035', '036', '037', '038', '039', // Landline
      '040', '041', '042', '043', '044', '045', '046', '047', '048', '049', '051', '052', '058', '060', '061', 
      '062', '063', '064', '065', '066', '067', '068', '069', // More landline
      '080', '081', '082', '083', '084', '085', '086', '087', '088', '089', // Special services
      '090', '091', '092', '093', '094', '095', '096', '097', '098', '099'  // Premium services
    ];
    
    const isValid = validPrefixes.includes(prefix);
    
    // Determine phone type for logging
    let phoneType = 'Unknown';
    if (['020', '024', '025', '026', '027', '030', '050', '053', '054', '055', '056', '057', '059'].includes(prefix)) {
      phoneType = 'Mobile';
    } else if (['021', '022', '023', '028', '029', '031', '032', '033', '034', '035', '036', '037', '038', '039',
                 '040', '041', '042', '043', '044', '045', '046', '047', '048', '049', '051', '052', '058', '060', '061', 
                 '062', '063', '064', '065', '066', '067', '068', '069'].includes(prefix)) {
      phoneType = 'Landline';
    } else if (['080', '081', '082', '083', '084', '085', '086', '087', '088', '089',
                 '090', '091', '092', '093', '094', '095', '096', '097', '098', '099'].includes(prefix)) {
      phoneType = 'Special Service';
    }
    
    this.log(`Ghana prefix validation (with zero): ${prefix} -> ${isValid ? 'VALID' : 'INVALID'} (${phoneType})`);
    if (this.enableVerboseLogging) {
      this.log(`Valid prefixes include: ${validPrefixes.slice(0, 10).join(', ')}...`);
    }
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
        this.log('Invalid Ghana prefix in 13-digit format:', nineDigitNumber);
        return phoneNumber; // Return original if invalid
      }
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith('233')) {
      // 233XXXXXXXXX format - convert to 0XXXXXXXXX
      const nineDigitNumber = cleanNumber.slice(3);
      if (this.isValidGhanaPrefix(nineDigitNumber)) {
        localNumber = '0' + nineDigitNumber;
      } else {
        this.log('Invalid Ghana prefix in 12-digit format:', nineDigitNumber);
        return phoneNumber; // Return original if invalid
      }
    } else if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
      // Already in 0XXXXXXXXX format - validate the prefix
      const nineDigitNumber = cleanNumber.slice(1);
      if (this.isValidGhanaPrefix(nineDigitNumber)) {
        localNumber = cleanNumber;
      } else {
        this.log('Invalid Ghana prefix in 10-digit format:', nineDigitNumber);
        return phoneNumber; // Return original if invalid
      }
    } else if (cleanNumber.length === 9) {
      // XXXXXXXXX format (local) - validate and convert to 0XXXXXXXXX
      if (this.isValidGhanaPrefix(cleanNumber)) {
        localNumber = '0' + cleanNumber;
      } else {
        this.log('Invalid Ghana prefix in 9-digit format:', cleanNumber);
        return phoneNumber; // Return original if invalid
      }
    } else {
      // Invalid format, return original
      this.log('Invalid Ghana phone number format:', cleanNumber);
      return phoneNumber;
    }
    
    this.log(`Ghana phone number formatted to local: ${phoneNumber} -> ${localNumber}`);
    return localNumber;
  }

  /**
   * Gets the network provider or phone type for a Ghana phone number
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
    
    const prefix = nineDigitNumber.substring(0, 3); // Changed from 2 to 3 digits
    
    // Mobile Network Providers
    if (['024', '025', '053', '054', '055', '059'].includes(prefix)) {
      return 'MTN Ghana';
    }
    
    if (['020', '050'].includes(prefix)) {
      return 'Telecel Ghana';
    }

    if (['026', '027', '056', '057'].includes(prefix)) {
      return 'AirtelTigo Ghana';
    }
    
    // Landline/Fixed Line Numbers
    if (['021', '022', '023', '028', '029', '031', '032', '033', '034', '035', '036', '037', '038', '039', 
         '040', '041', '042', '043', '044', '045', '046', '047', '048', '049', '051', '052', '058', '060', '061', 
         '062', '063', '064', '065', '066', '067', '068', '069'].includes(prefix)) {
      return 'Ghana Landline';
    }
    
    // Special Service Numbers
    if (['080', '081', '082', '083', '084', '085', '086', '087', '088', '089', 
         '090', '091', '092', '093', '094', '095', '096', '097', '098', '099'].includes(prefix)) {
      return 'Ghana Special Service';
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
      this.log(`Phone number sanitized: "${phoneNumber}" -> "${sanitizedNumber}"`);
    }

    const isValid = this.isValidGhanaPhoneNumber(sanitizedNumber);
    
    if (!isValid) {
      return {
        isValid: false,
        formatted: sanitizedNumber,
        local: sanitizedNumber,
        network: 'Unknown',
        error: `Invalid Ghana phone number format. We support mobile, landline, and special service numbers. Common prefixes: 024, 025, 053, 054, 055, 059 (MTN), 020, 050 (Telecel), 026, 027, 056, 057 (AirtelTigo), 021, 022, 023 (Landline), 080, 090 (Special Services)`
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
      this.log(warning);
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
