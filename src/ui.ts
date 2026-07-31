export const languages = {
  es: 'ES',
  en: 'EN',
};

export const defaultLang = 'es';

export const ui = {
  es: {
    'nav.obras': 'Obras',
    'nav.contacto': 'Contacto',
    'home.hero.title': 'Materializando el tiempo a través de la luz',
    'home.hero.desc': 'Cianotipias e intervenciones conceptuales que desafían la inmediatez de la modernidad líquida. Obras de alta exclusividad donde la memoria se imprime en azul de Prusia.',
    'home.featured': 'Obras Destacadas',
    'home.manifesto.title': 'El Santuario Creativo',
    'home.btn.buy': 'Adquirir Obra / Contacto',
    'home.btn.follow': 'Seguir en Instagram',
    'common.loading': 'Las obras se están cargando...',
  },
  en: {
    'nav.obras': 'Artworks',
    'nav.contacto': 'Contact',
    'home.hero.title': 'Materializing time through light',
    'home.hero.desc': 'Cyanotypes and conceptual interventions that challenge the immediacy of liquid modernity. Highly exclusive works where memory is printed in Prussian blue.',
    'home.featured': 'Selected Artworks',
    'home.manifesto.title': 'The Creative Sanctuary',
    'home.btn.buy': 'Acquire Artwork / Contact',
    'home.btn.follow': 'Follow on Instagram',
    'common.loading': 'Artworks are loading...',
  }
} as const;

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  }
}
