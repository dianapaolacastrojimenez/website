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

// 1. NUEVA INTERFAZ PARA EL CARRUSEL
export interface CarouselImage {
  imageUrl: string;
  altText: string;
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
      console.error("Google Sheets no devolvió datos. Respuesta de Google:", data);
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
      imageUrl: row[9] ? row[9].replace('open?id=', 'uc?id=') : "",
      order: parseInt(row[10] || "0", 10),
    })).sort((a: Artwork, b: Artwork) => a.order - b.order);
    
  } catch (error) {
    console.error("Error crítico al intentar conectar con Google:", error);
    return [];
  }
}

// 2. NUEVA FUNCIÓN PARA DESCARGAR EL CARRUSEL
export async function fetchCarousel(): Promise<CarouselImage[]> {
  const SHEET_ID = import.meta.env.GOOGLE_SHEET_ID;
  const API_KEY = import.meta.env.GOOGLE_API_KEY;

  if (!SHEET_ID || !API_KEY) {
    return [];
  }

  // Apuntamos a la nueva pestaña llamada "Carrusel" leyendo las columnas A y B
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Carrusel!A2:B?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) {
      return [];
    }

    return data.values.map((row: any[]) => ({
      // Mantenemos tu lógica de reemplazo para que los links de Google Drive funcionen igual
      imageUrl: row[0] ? row[0].replace('open?id=', 'uc?id=') : "",
      altText: row[1] || "Diana Castro - Colección exclusiva de arte contemporáneo",
    }));
  } catch (error) {
    console.error("Error al descargar datos del Carrusel:", error);
    return [];
  }
}
