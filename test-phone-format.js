// Test phone number formatting logic
function formatPhoneNumber(phoneNumber, countryIso) {
  if (!phoneNumber) return '';

  const cleanNumber = phoneNumber.replace(/\D/g, '');

  if (countryIso === 'GH') {
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

// Test cases
console.log('=== Ghana Phone Number Formatting Tests ===');
console.log('Input: 244588584 -> Output:', formatPhoneNumber('244588584', 'GH'));
console.log('Input: 0244588584 -> Output:', formatPhoneNumber('0244588584', 'GH'));
console.log('Input: 233244588584 -> Output:', formatPhoneNumber('233244588584', 'GH'));
console.log('Input: +2330244588584 -> Output:', formatPhoneNumber('+2330244588584', 'GH'));
console.log('Input: +233 024 458 8584 -> Output:', formatPhoneNumber('+233 024 458 8584', 'GH'));

console.log('\n=== International Phone Number Formatting Tests ===');
console.log('Input: 2348130678848 -> Output:', formatPhoneNumber('2348130678848', 'NG'));
console.log('Input: +2348130678848 -> Output:', formatPhoneNumber('+2348130678848', 'NG')); 