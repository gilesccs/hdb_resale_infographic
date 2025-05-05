import React from 'react';
import Header from './components/Header';
import PropertyMap from './components/PropertyMap';
import 'maplibre-gl/dist/maplibre-gl.css';

function App() {
  return (
    <div className="min-h-screen h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 relative">
        <PropertyMap />
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>Data source: data.gov.sg | Singapore Property Price Map © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;