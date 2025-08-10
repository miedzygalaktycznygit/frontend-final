import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Zmieniamy strategię na 'generateSW'
      strategies: 'generateSW',
      // Wyłączamy domyślną rejestrację, Firebase robi to za nas
      injectRegister: null,
      
      // Mówimy nowemu Service Workerowi, aby zaimportował nasz skrypt Firebase
      workbox: {
        importScripts: [
          'firebase-messaging-sw.js'
        ]
      },

      // Dodajemy podstawowy manifest aplikacji (dobra praktyka PWA)
      manifest: {
        name: 'Moja Aplikacja Zadaniowa',
        short_name: 'Zadania',
        description: 'Aplikacja do zarządzania zadaniami',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'vite.svg', // Możesz tu podać ścieżkę do ikony 192x192
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'vite.svg', // Możesz tu podać ścieżkę do ikony 512x512
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
});