import React from 'react';

const Logo = ({ className, size = 'default' }) => {
  const sizeClasses = {
    small: 'text-xl font-bold',
    default: 'text-2xl font-bold',
    large: 'text-4xl font-bold',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>      
      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-lg">VL</span>
      </div>
      <span className={sizeClasses[size]}>VENTURELIFT</span>
    </div>
  );
};

export default Logo;