/**
 * Form validation utilities and schemas
 * Centralized validation for all form inputs
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate recipe name
 */
export function isValidRecipeName(name: string): boolean {
  return name.trim().length >= 3 && name.length <= 100
}

/**
 * Validate inventory item quantity
 */
export function isValidQuantity(quantity: number | string): boolean {
  const num = typeof quantity === 'string' ? parseFloat(quantity) : quantity
  return !isNaN(num) && num >= 0
}

/**
 * Validate price
 */
export function isValidPrice(price: number | string): boolean {
  const num = typeof price === 'string' ? parseFloat(price) : price
  return !isNaN(num) && num >= 0 && num <= 999999.99
}

/**
 * Validate date is not in the past
 */
export function isValidFutureDate(date: Date): boolean {
  return new Date(date) > new Date()
}

/**
 * Validate date range
 */
export function isValidDateRange(startDate: Date, endDate: Date): boolean {
  return new Date(startDate) < new Date(endDate)
}

/**
 * Validate required field
 */
export function isRequired(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Validate minimum string length
 */
export function minLength(value: string, min: number): boolean {
  return value.trim().length >= min
}

/**
 * Validate maximum string length
 */
export function maxLength(value: string, max: number): boolean {
  return value.trim().length <= max
}

/**
 * Format validation errors for display
 */
export function formatValidationError(field: string, error: string): string {
  const fieldLabel = field.replace(/_/g, ' ').toLowerCase()
  return `${fieldLabel}: ${error}`
}

/**
 * Validate form field and return error message
 */
export function validateField(
  fieldName: string,
  value: any,
  validations: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    custom?: (value: any) => boolean | string
  }
): string | null {
  // Check required
  if (validations.required && !isRequired(value)) {
    return `${fieldName} is required`
  }

  // Check minLength
  if (validations.minLength && typeof value === 'string') {
    if (!minLength(value, validations.minLength)) {
      return `${fieldName} must be at least ${validations.minLength} characters`
    }
  }

  // Check maxLength
  if (validations.maxLength && typeof value === 'string') {
    if (!maxLength(value, validations.maxLength)) {
      return `${fieldName} must not exceed ${validations.maxLength} characters`
    }
  }

  // Check pattern
  if (validations.pattern && typeof value === 'string') {
    if (!validations.pattern.test(value)) {
      return `${fieldName} format is invalid`
    }
  }

  // Custom validation
  if (validations.custom) {
    const result = validations.custom(value)
    if (result !== true) {
      return typeof result === 'string' ? result : `${fieldName} is invalid`
    }
  }

  return null
}

/**
 * Validate entire form
 */
export function validateForm(
  formData: Record<string, any>,
  validationRules: Record<string, any>
): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const [fieldName, rules] of Object.entries(validationRules)) {
    const error = validateField(fieldName, formData[fieldName], rules)
    if (error) {
      errors[fieldName] = error
    }
  }

  return errors
}

/**
 * Check if form has errors
 */
export function hasErrors(errors: Record<string, string>): boolean {
  return Object.values(errors).some(error => error !== '')
}

/**
 * Clear specific field error
 */
export function clearFieldError(
  errors: Record<string, string>,
  fieldName: string
): Record<string, string> {
  const newErrors = { ...errors }
  delete newErrors[fieldName]
  return newErrors
}

/**
 * Clear all errors
 */
export function clearAllErrors(errors: Record<string, string>): Record<string, string> {
  return {}
}
