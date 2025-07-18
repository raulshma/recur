/**
 * Utility functions for accessibility testing and improvements
 */

/**
 * Announces a message to screen readers using an ARIA live region
 * 
 * @param message - The message to announce
 * @param priority - The priority of the announcement ('polite' or 'assertive')
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  // Create a temporary element for the announcement
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.setAttribute('class', 'sr-only');
  
  // Hide the element visually but keep it accessible to screen readers
  announcer.style.position = 'absolute';
  announcer.style.width = '1px';
  announcer.style.height = '1px';
  announcer.style.padding = '0';
  announcer.style.margin = '-1px';
  announcer.style.overflow = 'hidden';
  announcer.style.clip = 'rect(0, 0, 0, 0)';
  announcer.style.whiteSpace = 'nowrap';
  announcer.style.border = '0';
  
  // Add to the DOM
  document.body.appendChild(announcer);
  
  // Set the text content after a small delay to ensure the screen reader picks it up
  setTimeout(() => {
    announcer.textContent = message;
    
    // Remove the element after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 3000);
  }, 100);
}

/**
 * Creates a hidden element for screen readers only
 * 
 * @param id - The ID for the element
 * @param text - The text content for screen readers
 * @returns JSX element visible only to screen readers
 */
export function ScreenReaderOnly({ id, text }: { id?: string; text: string }): JSX.Element {
  return (
    <span
      id={id}
      className="sr-only"
      aria-hidden="false"
    >
      {text}
    </span>
  );
}

/**
 * Checks if the current focus is on an interactive element
 * 
 * @returns True if focus is on an interactive element
 */
export function isFocusOnInteractiveElement(): boolean {
  const activeElement = document.activeElement;
  
  if (!activeElement) return false;
  
  const interactiveElements = [
    'a', 'button', 'input', 'select', 'textarea', 'summary',
    '[role="button"]', '[role="link"]', '[role="checkbox"]',
    '[role="radio"]', '[role="switch"]', '[role="menuitem"]',
    '[role="option"]', '[role="tab"]', '[tabindex]'
  ];
  
  // Check if the active element matches any of the interactive elements
  return interactiveElements.some(selector => {
    if (selector === '[tabindex]') {
      return activeElement.hasAttribute('tabindex') && 
             activeElement.getAttribute('tabindex') !== '-1';
    }
    
    return activeElement.matches(selector);
  });
}