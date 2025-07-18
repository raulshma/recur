import { useRef, useEffect } from 'react';

/**
 * Hook for managing focus in forms and interactive components
 * 
 * @param shouldFocus - Whether the element should receive focus
 * @param dependencies - Array of dependencies that should trigger focus when changed
 * @returns Ref to attach to the element that should receive focus
 */
export function useFocusManagement<T extends HTMLElement>(
  shouldFocus: boolean = true,
  dependencies: any[] = []
) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      // Small delay to ensure the element is fully rendered
      const timeoutId = setTimeout(() => {
        elementRef.current?.focus();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [shouldFocus, ...dependencies]);

  return elementRef;
}

/**
 * Hook for trapping focus within a container
 * 
 * @param active - Whether focus trapping is active
 * @returns Ref to attach to the container element
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean = true) {
  const containerRef = useRef<T>(null);
  
  useEffect(() => {
    if (!active || !containerRef.current) return;
    
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      // Shift + Tab => backwards
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } 
      // Tab => forwards
      else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Focus the first element when the trap is activated
    if (firstElement && !container.contains(document.activeElement)) {
      firstElement.focus();
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active]);
  
  return containerRef;
}

/**
 * Hook for managing focus when errors occur in a form
 * 
 * @param hasError - Whether there is an error that needs attention
 * @param errorRef - Ref to the error element or message
 * @returns Ref to attach to the form element
 */
export function useErrorFocus<T extends HTMLElement>(
  hasError: boolean,
  errorRef: React.RefObject<HTMLElement>
) {
  useEffect(() => {
    if (hasError && errorRef.current) {
      // Focus the first error element
      errorRef.current.focus();
      
      // Announce the error for screen readers
      errorRef.current.setAttribute('aria-live', 'assertive');
      
      // Reset the aria-live attribute after announcement
      const timeoutId = setTimeout(() => {
        if (errorRef.current) {
          errorRef.current.setAttribute('aria-live', 'off');
        }
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [hasError, errorRef]);
}