import React from 'react';
import { MapPin } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-md">
      <div className="container mx-auto py-4 px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            <h1 className="text-xl md:text-2xl font-bold">Singapore Property Price Map</h1>
          </div>
          <div className="text-sm md:text-base">
            <span className="opacity-90">Interactive Resale Price Visualization</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;