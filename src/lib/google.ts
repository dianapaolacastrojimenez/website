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

export async function fetchArtworks(): Promise<Artwork[]> {
  // 1. ASTRO FIX: Usar import.meta.env en lugar de process.env
  const SHEET_ID = import.meta.env.GOOGLE_SHEET_ID;
  const API_KEY = import.meta.env.GOOGLE_API_KEY;

  // Si GitHub no inyectó las claves, avisamos en la consola de Actions
  if (!SHEET_ID || !API_KEY) {
    console.error("Faltan las credenciales de Google Sheets (SHEET_ID o API_KEY).");
    return [];
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Obras!A2:K?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // 2. FIX DEL .map(): Si Google devuelve un error en lugar de valores
    if (!data.values) {
      console.error("Google Sheets no devolvió datos. Respuesta de Google:", data);
      return [];
    }

    // 3. Mapeo seguro: Si una celda está vacía, no rompe el código
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
