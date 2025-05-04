import React from 'react';
import Header from './components/Header';
import PropertyMap from './components/PropertyMap';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <PropertyMap />
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>Data source: data.gov.sg | Singapore Property Price Map © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;