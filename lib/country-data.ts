export interface CountryData {
  code: string
  name: string
  phoneCode: string
  phoneFormat: {
    pattern: RegExp
    placeholder: string
    maxLength: number
    example: string
  }
  zipCodeFormat: {
    pattern: RegExp
    placeholder: string
    maxLength: number
    example: string
  }
  addressFormat: {
    hasState: boolean
    stateLabel: string
    hasProvince: boolean
    provinceLabel: string
    hasRegion: boolean
    regionLabel: string
  }
}

export const COUNTRIES: CountryData[] = [
  {
    code: 'PH',
    name: 'Philippines',
    phoneCode: '+63',
    phoneFormat: {
      pattern: /^\+63\d{10}$/,
      placeholder: '+639123456789',
      maxLength: 13, // +63 + 10 digits
      example: '+639123456789'
    },
    zipCodeFormat: {
      pattern: /^\d{4}$/,
      placeholder: '1000',
      maxLength: 4,
      example: '1000'
    },
    addressFormat: {
      hasState: false,
      stateLabel: '',
      hasProvince: true,
      provinceLabel: 'Province',
      hasRegion: true,
      regionLabel: 'Region'
    }
  },
  {
    code: 'SG',
    name: 'Singapore',
    phoneCode: '+65',
    phoneFormat: {
      pattern: /^\+65\d{8}$/,
      placeholder: '+6512345678',
      maxLength: 11,
      example: '+6512345678'
    },
    zipCodeFormat: {
      pattern: /^\d{6}$/,
      placeholder: '018956',
      maxLength: 6,
      example: '018956'
    },
    addressFormat: {
      hasState: false,
      stateLabel: '',
      hasProvince: false,
      provinceLabel: '',
      hasRegion: false,
      regionLabel: ''
    }
  },
  {
    code: 'MY',
    name: 'Malaysia',
    phoneCode: '+60',
    phoneFormat: {
      pattern: /^\+60\d{9,10}$/,
      placeholder: '+60123456789',
      maxLength: 13,
      example: '+60123456789'
    },
    zipCodeFormat: {
      pattern: /^\d{5}$/,
      placeholder: '50000',
      maxLength: 5,
      example: '50000'
    },
    addressFormat: {
      hasState: true,
      stateLabel: 'State',
      hasProvince: false,
      provinceLabel: '',
      hasRegion: false,
      regionLabel: ''
    }
  },
  {
    code: 'TH',
    name: 'Thailand',
    phoneCode: '+66',
    phoneFormat: {
      pattern: /^\+66\d{9}$/,
      placeholder: '+66123456789',
      maxLength: 12,
      example: '+66123456789'
    },
    zipCodeFormat: {
      pattern: /^\d{5}$/,
      placeholder: '10100',
      maxLength: 5,
      example: '10100'
    },
    addressFormat: {
      hasState: false,
      stateLabel: '',
      hasProvince: true,
      provinceLabel: 'Province',
      hasRegion: false,
      regionLabel: ''
    }
  },
  {
    code: 'US',
    name: 'United States',
    phoneCode: '+1',
    phoneFormat: {
      pattern: /^\+1\d{10}$/,
      placeholder: '+1 (555) 123-4567',
      maxLength: 12,
      example: '+15551234567'
    },
    zipCodeFormat: {
      pattern: /^\d{5}(-\d{4})?$/,
      placeholder: '10001',
      maxLength: 10,
      example: '10001'
    },
    addressFormat: {
      hasState: true,
      stateLabel: 'State',
      hasProvince: false,
      provinceLabel: '',
      hasRegion: false,
      regionLabel: ''
    }
  },
  {
    code: 'CA',
    name: 'Canada',
    phoneCode: '+1',
    phoneFormat: {
      pattern: /^\+1\d{10}$/,
      placeholder: '+1 (555) 123-4567',
      maxLength: 12,
      example: '+15551234567'
    },
    zipCodeFormat: {
      pattern: /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/,
      placeholder: 'K1A 0B1',
      maxLength: 7,
      example: 'K1A 0B1'
    },
    addressFormat: {
      hasState: true,
      stateLabel: 'Province',
      hasProvince: false,
      provinceLabel: '',
      hasRegion: false,
      regionLabel: ''
    }
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    phoneCode: '+44',
    phoneFormat: {
      pattern: /^\+44\d{10,11}$/,
      placeholder: '+44 20 1234 5678',
      maxLength: 13,
      example: '+442012345678'
    },
    zipCodeFormat: {
      pattern: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i,
      placeholder: 'SW1A 1AA',
      maxLength: 8,
      example: 'SW1A 1AA'
    },
    addressFormat: {
      hasState: false,
      stateLabel: '',
      hasProvince: false,
      provinceLabel: '',
      hasRegion: false,
      regionLabel: ''
    }
  },
  {
    code: 'AU',
    name: 'Australia',
    phoneCode: '+61',
    phoneFormat: {
      pattern: /^\+61\d{9}$/,
      placeholder: '+61 2 1234 5678',
      maxLength: 12,
      example: '+61212345678'
    },
    zipCodeFormat: {
      pattern: /^\d{4}$/,
      placeholder: '2000',
      maxLength: 4,
      example: '2000'
    },
    addressFormat: {
      hasState: true,
      stateLabel: 'State',
      hasProvince: false,
      provinceLabel: '',
      hasRegion: false,
      regionLabel: ''
    }
  }
]

export function getCountryByCode(code: string): CountryData | undefined {
  return COUNTRIES.find(country => country.code === code)
}

export function formatPhoneNumber(phone: string, countryCode: string): string {
  const country = getCountryByCode(countryCode)
  if (!country) return phone

  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // If empty, return empty
  if (!cleaned) return ''
  
  // If it doesn't start with +, add the country code
  if (!cleaned.startsWith('+')) {
    // Remove any leading zeros (common in Philippines)
    cleaned = cleaned.replace(/^0+/, '')
    cleaned = country.phoneCode + cleaned.replace(/\D/g, '')
  } else {
    // If it starts with + but wrong country code, replace it
    if (!cleaned.startsWith(country.phoneCode)) {
      cleaned = cleaned.replace(/^\+\d{1,3}/, country.phoneCode)
    }
  }

  // Limit to max length
  if (cleaned.length > country.phoneFormat.maxLength) {
    cleaned = cleaned.substring(0, country.phoneFormat.maxLength)
  }

  return cleaned
}

export function validatePhoneNumber(phone: string, countryCode: string): boolean {
  const country = getCountryByCode(countryCode)
  if (!country) return false
  
  const formatted = formatPhoneNumber(phone, countryCode)
  return country.phoneFormat.pattern.test(formatted)
}

export function formatZipCode(zip: string, countryCode: string): string {
  const country = getCountryByCode(countryCode)
  if (!country) return zip

  // Check if pattern is numeric-only (contains only \d without letters)
  const patternStr = country.zipCodeFormat.pattern.source
  const isNumericOnly = patternStr.includes('\\d') && !/[A-Za-z]/.test(patternStr)
  
  if (isNumericOnly) {
    // For numeric ZIP codes, only allow digits
    return zip.replace(/\D/g, '').substring(0, country.zipCodeFormat.maxLength)
  }

  // For alphanumeric ZIP codes, allow letters and numbers
  return zip.substring(0, country.zipCodeFormat.maxLength)
}

export function validateZipCode(zip: string, countryCode: string): boolean {
  const country = getCountryByCode(countryCode)
  if (!country) return false
  
  return country.zipCodeFormat.pattern.test(zip)
}

