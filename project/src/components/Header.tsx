import React from 'react';
import { Building2 } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-md w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 w-full">
        <div className="flex items-center gap-3 font-sans mb-1 sm:mb-0">
          <span className="inline-flex items-center justify-center rounded-full bg-white/20 p-2">
            <Building2 className="h-7 w-7 text-white drop-shadow" />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Resale HDB Interactive Map</h1>
        </div>
        <div className="font-sans text-xs sm:text-base font-medium opacity-90 mt-1 sm:mt-0">
          Interactive Resale Price Visualization
        </div>
      </div>
    </header>
  );
};

export default Header;