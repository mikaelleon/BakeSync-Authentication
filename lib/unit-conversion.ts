/**
 * Unit conversion utilities for inventory and recipe management
 */

export type Unit = 
  | 'g' | 'kg' | 'mg' | 'oz' | 'lb'
  | 'ml' | 'l' | 'fl oz' | 'cup' | 'tbsp' | 'tsp'
  | 'pieces' | 'units' | 'pcs'
  | 'dozen' | 'box' | 'pack'

// Conversion factors to base unit (g for weight, ml for volume, pieces for count)
const CONVERSION_TO_BASE: Record<string, number> = {
  // Weight (base: g)
  'mg': 0.001,
  'g': 1,
  'kg': 1000,
  'oz': 28.3495,
  'lb': 453.592,
  
  // Volume (base: ml)
  'ml': 1,
  'l': 1000,
  'fl oz': 29.5735,
  'cup': 236.588,
  'tbsp': 14.7868,
  'tsp': 4.92892,
  
  // Count (base: pieces)
  'pieces': 1,
  'units': 1,
  'pcs': 1,
  'dozen': 12,
  'box': 1, // Box is treated as 1 unit, actual quantity should be specified
  'pack': 1, // Pack is treated as 1 unit, actual quantity should be specified
}

// Unit categories
const UNIT_CATEGORIES: Record<string, string[]> = {
  weight: ['mg', 'g', 'kg', 'oz', 'lb'],
  volume: ['ml', 'l', 'fl oz', 'cup', 'tbsp', 'tsp'],
  count: ['pieces', 'units', 'pcs', 'dozen', 'box', 'pack']
}

/**
 * Get the category of a unit
 */
function getUnitCategory(unit: string): string | null {
  const normalizedUnit = unit.toLowerCase().trim()
  for (const [category, units] of Object.entries(UNIT_CATEGORIES)) {
    if (units.includes(normalizedUnit)) {
      return category
    }
  }
  return null
}

/**
 * Check if two units are compatible (same category)
 */
export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  const cat1 = getUnitCategory(unit1)
  const cat2 = getUnitCategory(unit2)
  return cat1 !== null && cat1 === cat2
}

/**
 * Convert a quantity from one unit to another
 * Returns null if units are incompatible
 */
export function convertUnit(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number | null {
  const normalizedFrom = fromUnit.toLowerCase().trim()
  const normalizedTo = toUnit.toLowerCase().trim()
  
  // If units are the same, no conversion needed
  if (normalizedFrom === normalizedTo) {
    return quantity
  }
  
  // Check if units are compatible
  if (!areUnitsCompatible(normalizedFrom, normalizedTo)) {
    return null
  }
  
  // Get conversion factors
  const fromFactor = CONVERSION_TO_BASE[normalizedFrom]
  const toFactor = CONVERSION_TO_BASE[normalizedTo]
  
  if (!fromFactor || !toFactor) {
    return null
  }
  
  // Convert to base unit, then to target unit
  const baseQuantity = quantity * fromFactor
  return baseQuantity / toFactor
}

/**
 * Normalize unit string (handle variations)
 */
export function normalizeUnit(unit: string): string {
  const normalized = unit.toLowerCase().trim()
  
  // Handle common variations
  const variations: Record<string, string> = {
    'gram': 'g',
    'grams': 'g',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'milligram': 'mg',
    'milligrams': 'mg',
    'ounce': 'oz',
    'ounces': 'oz',
    'pound': 'lb',
    'pounds': 'lb',
    'liter': 'l',
    'liters': 'l',
    'litre': 'l',
    'litres': 'l',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'millilitre': 'ml',
    'millilitres': 'ml',
    'piece': 'pieces',
    'unit': 'units',
    'pc': 'pcs',
    'pcs': 'pieces',
  }
  
  return variations[normalized] || normalized
}

/**
 * Format unit for display
 */
export function formatUnit(unit: string): string {
  const normalized = normalizeUnit(unit)
  return normalized
}


