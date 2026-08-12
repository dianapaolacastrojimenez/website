import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://dianacastro.art',
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
  },
  // Motor Bilingüe: Configuración Nativa de Idiomas (ES/EN)
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false, // Mantiene la URL raíz limpia para español (dianacastroart.com)
    }
  }
});
