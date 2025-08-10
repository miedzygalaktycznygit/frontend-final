import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Stary middleware do typu MIME jest już niepotrzebny, wtyczka PWA sobie z tym poradzi.

export default defineConfig({
  plugins: [
    react(),
    // Konfiguracja wtyczki PWA
    VitePWA({
      // Używamy strategii 'injectManifest', która bierze nasz istniejący plik Service Workera
      strategies: 'injectManifest',
      // Wskazujemy, gdzie znajduje się nasz plik źródłowy
      srcDir: 'public',
      filename: 'firebase-messaging-sw.js',
      // Wyłączamy domyślną rejestrację, ponieważ Firebase robi to za nas
      injectRegister: null,
    })
  ],
});