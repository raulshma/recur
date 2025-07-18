import React, { useEffect } from 'react';

interface KeyboardNavigationProps {
  /**
   * The component children
   */
  children: React.ReactNode;
  
  /**
   * Optional callback for when the escape key is pressed
   */
  onEscape?: () => void;
  
  /**
   * Optional callback for when the enter key is pressed
   */
  onEnter?: () => void;
  
  /**
   * Whether keyboard navigation is enabled
   */
  enabled?: boolean;
}

/**
 * KeyboardNavigation component
 * 
 * A utility component that adds keyboard navigation support to its children.
 * It handles common keyboard shortcuts like Escape and Enter.
 */
const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  children,
  onEscape,
  onEnter,
  enabled = true,
}) => {
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape key
      if (e.key === 'Escape' && onEscape) {
        onEscape();
      }
      
      // Handle Enter key (when not in a form field)
      if (e.key === 'Enter' && onEnter) {
        const activeElement = document.activeElement;
        const isFormElement = 
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          activeElement instanceof HTMLSelectElement ||
          activeElement instanceof HTMLButtonElement;
          
        if (!isFormElement) {
          onEnter();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onEscape, onEnter]);
  
  return <>{children}</>;
};

export default KeyboardNavigation;