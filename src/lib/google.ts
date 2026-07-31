export interface Artwork {
  id: string;
  title: string;
  series: string;
  year: string;
  technique: string;
  dimensions: string;
  availability: string;
  price?: string;
  description: string;
  imageUrl: string;
  order: number;
}

export interface CarouselImage {
  imageUrl: string;
  altText: string;
}

// NUEVA FUNCIÓN: Procesa la imagen para saber si es un archivo local de GitHub o un link
function processImageString(rawString: string): string {
  if (!rawString) return "";
  
  // 1. Si por alguna razón vuelve a ser un enlace de Google Drive, lo repara
  if (rawString.includes('open?id=')) {
    return rawString.replace('open?id=', 'uc?id=');
  }
  
  // 2. Si es una URL de internet normal (https://...), la deja igual
  if (rawString.startsWith('http')) {
    return rawString;
  }
  
  // 3. FIX PARA GITHUB: Si es solo el nombre del archivo (ej: "carrusel-1.jpg"), 
  // le agrega el "/" al inicio para que Astro lo busque en la carpeta public/
  return rawString.startsWith('/') ? rawString : `/${rawString}`;
}

export async function fetchArtworks(): Promise<Artwork[]> {
  const SHEET_ID = import.meta.env.GOOGLE_SHEET_ID;
  const API_KEY = import.meta.env.GOOGLE_API_KEY;

  if (!SHEET_ID || !API_KEY) {
    console.error("Faltan las credenciales de Google Sheets (SHEET_ID o API_KEY).");
    return [];
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Obras!A2:K?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) {
      return [];
    }

    return data.values.map((row: any[]) => ({
      id: row[0] || "",
      title: row[1] || "",
      series: row[2] || "",
      year: row[3] || "",
      technique: row[4] || "",
      dimensions: row[5] || "",
      availability: row[6] || "",
      price: row[7] || null,
      description: row[8] || "",
      // Usamos la nueva función inteligente para la imagen
      imageUrl: processImageString(row[9]),
      order: parseInt(row[10] || "0", 10),
    })).sort((a: Artwork, b: Artwork) => a.order - b.order);
    
  } catch (error) {
    console.error("Error crítico al intentar conectar con Google:", error);
    return [];
  }
}

export async function fetchCarousel(): Promise<CarouselImage[]> {
  const SHEET_ID = import.meta.env.GOOGLE_SHEET_ID;
  const API_KEY = import.meta.env.GOOGLE_API_KEY;

  if (!SHEET_ID || !API_KEY) {
    return [];
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Carrusel!A2:B?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) {
      return [];
    }

    return data.values.map((row: any[]) => ({
      // Usamos la nueva función inteligente para la imagen del carrusel
      imageUrl: processImageString(row[0]),
      altText: row[1] || "Diana Castro - Colección exclusiva de arte contemporáneo",
    }));
  } catch (error) {
    console.error("Error al descargar datos del Carrusel:", error);
    return [];
  }
}
