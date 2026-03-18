/**
 * Accessibility utilities for improving WCAG compliance
 * Provides helper functions and patterns for accessible UI components
 */

/**
 * Create accessible aria-labels for icon buttons
 * @example
 * <IconButton
 *   aria-label={getIconButtonLabel('Add new recipe')}
 *   onClick={handleAdd}
 * >
 *   <Plus />
 * </IconButton>
 */
export function getIconButtonLabel(action: string): string {
  return `${action} button`
}

/**
 * Create accessible labels for form fields
 * Helps ensure all inputs have associated labels
 */
export function createFieldLabel(fieldName: string, required: boolean = false): string {
  return `${fieldName}${required ? ' (required)' : ''}`
}

/**
 * Get color contrast ratio (simple version)
 * Returns true if contrast is likely sufficient
 */
export function hasGoodContrast(foreground: string, background: string): boolean {
  // Simplified check - in production use dedicated library like polished or wcag
  const getLuminance = (color: string) => {
    const rgb = color.match(/\d+/g)
    if (!rgb || rgb.length < 3) return 0.5
    const [r, g, b] = rgb.map(x => parseInt(x) / 255)
    return (0.299 * r + 0.587 * g + 0.114 * b)
  }
  
  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  const contrast = (lighter + 0.05) / (darker + 0.05)
  
  return contrast >= 4.5 // WCAG AA standard for normal text
}

/**
 * Create keyboard navigation helper for custom select/menu components
 * Implements arrow key navigation and enter/space to select
 */
export function useKeyboardNavigation(
  items: { id: string }[],
  onSelect: (id: string) => void
) {
  const handleKeyDown = (event: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault()
        newIndex = (currentIndex + 1) % items.length
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault()
        newIndex = (currentIndex - 1 + items.length) % items.length
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onSelect(items[currentIndex].id)
        return
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = items.length - 1
        break
      default:
        return
    }

    // Focus the new item (component should handle this)
    return newIndex
  }

  return { handleKeyDown }
}

/**
 * Create accessible data table row with proper ARIA attributes
 */
export interface AccessibleTableRowProps {
  id: string
  label?: string
  isSelected?: boolean
  isExpanded?: boolean
}

export function getAccessibleTableRowProps({
  id,
  label,
  isSelected = false,
  isExpanded
}: AccessibleTableRowProps) {
  return {
    role: 'row',
    'aria-label': label || id,
    'aria-selected': isSelected,
    'aria-expanded': isExpanded,
    'data-testid': `table-row-${id}`
  }
}

/**
 * Announce changes to screen readers
 * Use for dynamic content updates
 */
export function useAriaLive() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Create a temporary aria-live region
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only' // Screen reader only
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  return { announce }
}
