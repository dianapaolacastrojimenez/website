import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://dianacastroart.com',
  output: 'static', // Vital para máximo rendimiento y seguridad en Hostinger
  integrations: [
    tailwind(),
    react(), // Necesario para PhotoSwipe interactivo
  ],
  image: {
    domains: ['drive.google.com'], // Permite optimizar imágenes desde Drive
    remotePatterns: [{ protocol: 'https' }],
  },
  build: {
    format: 'directory', // Ideal para URLs limpias (/obras/ en lugar de /obras.html)
  }
});
