import React from 'react';
import { Building2 } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-md w-full">
      <div className="flex items-center justify-between px-6 py-4 w-full">
        <div className="flex items-center gap-3 font-sans" style={{ fontFamily: 'PT Root UI, ui-sans-serif, system-ui, sans-serif' }}>
          <span className="inline-flex items-center justify-center rounded-full bg-white/20 p-2">
            <Building2 className="h-7 w-7 text-white drop-shadow" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Resale HDB Interactive Map</h1>
        </div>
        <div className="font-sans text-base font-medium opacity-90" style={{ fontFamily: 'PT Root UI, ui-sans-serif, system-ui, sans-serif' }}>
          Interactive Resale Price Visualization
        </div>
      </div>
    </header>
  );
};

export default Header;