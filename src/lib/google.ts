export interface Artwork {
  id: string;
  title: string;
  titleEn: string;
  series: string;
  year: string;
  technique: string;
  techniqueEn: string;
  dimensions: string;
  availability: string;
  price?: string;
  description: string;
  descriptionEn: string;
  imageUrl: string;
  order: number;

  // Control desde Google Sheets
  showSeriesButton: boolean;
}

export interface CarouselImage {
  imageUrl: string;
  altText: string;
  altTextEn: string;
}


/**
 * Convierte diferentes formatos de imágenes
 * almacenados en Google Sheets a una ruta
 * utilizable por el navegador.
 */
function processImageString(rawString: string): string {
  if (!rawString) return "";

  const value = String(rawString).trim();

  if (!value) return "";

  // Google Drive antiguo
  if (value.includes("open?id=")) {
    return value.replace("open?id=", "uc?id=");
  }

  // URLs completas
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  // Rutas locales
  return value.startsWith("/") ? value : `/${value}`;
}


/**
 * Convierte los diferentes valores que pueden aparecer
 * en Google Sheets:
 *
 * SI
 * si
 * Si
 * YES
 * yes
 * TRUE
 * 1
 *
 * en true.
 */
function isEnabled(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  const normalized = String(value)
    .trim()
    .toLowerCase();

  return (
    normalized === "si" ||
    normalized === "sí" ||
    normalized === "yes" ||
    normalized === "true" ||
    normalized === "1" ||
    normalized === "x"
  );
}


/**
 * Obtiene todas las obras desde Google Sheets.
 *
 * Hoja: Obras
 *
 * A = ID
 * B = title
 * C = serie
 * D = año
 * E = technique
 * F = dimensiones
 * G = availability
 * H = price
 * I = descripcion
 * J = imagen
 * K = orden
 * L = tituloEn
 * M = tecnicaEn
 * N = DescripcionEn
 * O = Mostrar botón serie
 */
export async function fetchArtworks(): Promise<Artwork[]> {
  const SHEET_ID = import.meta.env.GOOGLE_SHEET_ID;
  const API_KEY = import.meta.env.GOOGLE_API_KEY;

  if (!SHEET_ID || !API_KEY) {
    console.error(
      "Faltan GOOGLE_SHEET_ID o GOOGLE_API_KEY."
    );

    return [];
  }

  /**
   * IMPORTANTE:
   * Leemos hasta la columna O.
   */
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/` +
    `${SHEET_ID}/values/Obras!A2:O?key=${API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `Google Sheets respondió con HTTP ${response.status}`
      );

      return [];
    }

    const data = await response.json();

    if (!data.values || !Array.isArray(data.values)) {
      return [];
    }

    const artworks: Artwork[] = data.values
      .map((row: any[]) => {

        const orderValue = Number.parseInt(
          String(row[10] ?? "0").trim(),
          10
        );

        return {
          id: String(row[0] ?? "").trim(),

          title: String(row[1] ?? "").trim(),

          series: String(row[2] ?? "").trim(),

          year: String(row[3] ?? "").trim(),

          technique: String(row[4] ?? "").trim(),

          dimensions: String(row[5] ?? "").trim(),

          availability: String(row[6] ?? "").trim(),

          price:
            row[7] !== undefined &&
            row[7] !== null &&
            String(row[7]).trim() !== ""
              ? String(row[7]).trim()
              : undefined,

          description: String(row[8] ?? ""),

          imageUrl: processImageString(
            String(row[9] ?? "")
          ),

          order: Number.isNaN(orderValue)
            ? 0
            : orderValue,

          titleEn:
            String(row[11] ?? "").trim() ||
            String(row[1] ?? "").trim(),

          techniqueEn:
            String(row[12] ?? "").trim() ||
            String(row[4] ?? "").trim(),

          descriptionEn:
            String(row[13] ?? "") ||
            String(row[8] ?? ""),

          /**
           * COLUMNA O
           *
           * row[14] = Mostrar botón serie
           */
          showSeriesButton: isEnabled(row[14]),
        };
      })
      .filter((obra: Artwork) => obra.id !== "");

    return artworks.sort(
      (a: Artwork, b: Artwork) =>
        a.order - b.order
    );

  } catch (error) {
    console.error(
      "Error conectando con Google Obras:",
      error
    );

    return [];
  }
}


/**
 * Obtiene las imágenes del Carrusel.
 *
 * Hoja: Carrusel
 *
 * A = imagen
 * B = altText
 * C = altTextEn
 */
export async function fetchCarousel(): Promise<CarouselImage[]> {
  const SHEET_ID = import.meta.env.GOOGLE_SHEET_ID;
  const API_KEY = import.meta.env.GOOGLE_API_KEY;

  if (!SHEET_ID || !API_KEY) {
    return [];
  }

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/` +
    `${SHEET_ID}/values/Carrusel!A2:C?key=${API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `Error Carrusel HTTP ${response.status}`
      );

      return [];
    }

    const data = await response.json();

    if (!data.values || !Array.isArray(data.values)) {
      return [];
    }

    return data.values.map((row: any[]) => ({
      imageUrl: processImageString(
        String(row[0] ?? "")
      ),

      altText:
        String(row[1] ?? "").trim() ||
        "Diana Castro - Colección exclusiva",

      altTextEn:
        String(row[2] ?? "").trim() ||
        String(row[1] ?? "").trim() ||
        "Diana Castro - Exclusive collection",
    }));

  } catch (error) {
    console.error(
      "Error conectando con Carrusel:",
      error
    );

    return [];
  }
}
