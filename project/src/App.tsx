import React from 'react';
import { MantineProvider } from '@mantine/core';
import Header from './components/Header';
import PropertyMap from './components/PropertyMap';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@mantine/core/styles.css';

function App() {
  return (
    <MantineProvider
      theme={{
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        headings: {
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        }
      }}
    >
      <div className="min-h-screen h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 relative min-h-0">
          <PropertyMap />
        </main>
        <footer className="bg-gray-800 text-white p-2 sm:p-4 text-center text-xs sm:text-sm">
          <p>Data source: data.gov.sg | Singapore Property Price Map © {new Date().getFullYear()}</p>
        </footer>
      </div>
    </MantineProvider>
  );
}

export default App;