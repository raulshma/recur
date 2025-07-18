import React from 'react';

/**
 * Logo component
 * 
 * A reusable logo component for authentication pages.
 */
const Logo: React.FC = () => {
  return (
    <div className="flex justify-center">
      <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-xl">R</span>
      </div>
    </div>
  );
};

export default Logo;