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

  // Controla desde Google Sheets si aparece
  // el botón "Ver todas las Cianotipias de esta serie"
  showSeriesButton: boolean;
}

export interface CarouselImage {
  imageUrl: string;
  altText: string;
  altTextEn: string;
}


/**
 * Convierte diferentes formatos de imágenes
 * de Google Drive en una URL utilizable por el navegador.
 *
 * También conserva URLs normales y rutas locales.
 */
function processImageString(rawString: string): string {
  if (!rawString) return "";

  const value = String(rawString).trim();

  if (!value) return "";


  // -----------------------------------------------------------
  // Rutas locales
  // -----------------------------------------------------------

  if (value.startsWith("/")) {
    return value;
  }


  // -----------------------------------------------------------
  // Google Drive:
  // https://drive.google.com/open?id=XXXXXXXX
  // -----------------------------------------------------------

  const openIdMatch = value.match(
    /drive\.google\.com\/open\?id=([^&]+)/i
  );

  if (openIdMatch?.[1]) {
    return `https://drive.google.com/uc?export=view&id=${openIdMatch[1]}`;
  }


  // -----------------------------------------------------------
  // Google Drive:
  // https://drive.google.com/file/d/XXXXXXXX/view
  // -----------------------------------------------------------

  const fileIdMatch = value.match(
    /drive\.google\.com\/file\/d\/([^/]+)/i
  );

  if (fileIdMatch?.[1]) {
    return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
  }


  // -----------------------------------------------------------
  // Google Drive:
  // https://drive.google.com/uc?id=XXXXXXXX
  // -----------------------------------------------------------

  const ucIdMatch = value.match(
    /drive\.google\.com\/uc\?(?:[^#]*&)?id=([^&]+)/i
  );

  if (ucIdMatch?.[1]) {
    return `https://drive.google.com/uc?export=view&id=${ucIdMatch[1]}`;
  }


  // -----------------------------------------------------------
  // Google Drive:
  // URL con /d/XXXXXXXX/
  // -----------------------------------------------------------

  const genericDriveIdMatch = value.match(
    /\/d\/([^/]+)/
  );

  if (
    value.includes("drive.google.com") &&
    genericDriveIdMatch?.[1]
  ) {
    return `https://drive.google.com/uc?export=view&id=${genericDriveIdMatch[1]}`;
  }


  // -----------------------------------------------------------
  // URL normal
  // -----------------------------------------------------------

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }


  // -----------------------------------------------------------
  // Nombre/ruta de imagen local
  // -----------------------------------------------------------

  return `/${value}`;
}


/**
 * Convierte diferentes valores de Google Sheets
 * en verdadero/falso.
 *
 * Valores aceptados como TRUE:
 * SI
 * SÍ
 * YES
 * TRUE
 * 1
 * X
 *
 * Todo lo demás se considera FALSE.
 */
function parseBoolean(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  const normalized = String(value)
    .trim()
    .toLowerCase();

  return [
    "si",
    "sí",
    "yes",
    "true",
    "1",
    "x",
    "on",
  ].includes(normalized);
}


/**
 * Obtiene las obras desde Google Sheets.
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


  /*
   * IMPORTANTE:
   *
   * Ahora leemos hasta la columna O.
   *
   * A = ID
   * B = título
   * C = serie
   * D = año
   * E = técnica
   * F = dimensiones
   * G = disponibilidad
   * H = precio
   * I = descripción
   * J = imagen
   * K = orden
   * L = título inglés
   * M = técnica inglés
   * N = descripción inglés
   * O = mostrar botón de serie
   */

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/` +
    `${SHEET_ID}/values/Obras!A2:O?key=${API_KEY}`;


  try {

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Google Sheets respondió con HTTP ${response.status}`
      );
    }


    const data = await response.json();


    if (!data.values) {
      return [];
    }


    return data.values
      .map((row: any[]) => {

        return {

          id: row[0] || "",

          title: row[1] || "",

          series: row[2] || "",

          year: row[3] || "",

          technique: row[4] || "",

          dimensions: row[5] || "",

          availability: row[6] || "",

          price: row[7] || null,

          description: row[8] || "",

          imageUrl: processImageString(row[9]),

          order: parseInt(
            row[10] || "0",
            10
          ),

          titleEn:
            row[11] ||
            row[1] ||
            "",

          techniqueEn:
            row[12] ||
            row[4] ||
            "",

          descriptionEn:
            row[13] ||
            row[8] ||
            "",

          /*
           * NUEVO:
           *
           * Columna O.
           *
           * SI = mostrar botón
           * NO = no mostrar botón
           */
          showSeriesButton:
            parseBoolean(row[14]),

        } satisfies Artwork;

      })
      .sort(
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
 * Obtiene las imágenes del carrusel principal.
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
      throw new Error(
        `Google Sheets respondió con HTTP ${response.status}`
      );
    }


    const data = await response.json();


    if (!data.values) {
      return [];
    }


    return data.values.map(
      (row: any[]) => ({

        imageUrl:
          processImageString(row[0]),

        altText:
          row[1] ||
          "Diana Castro - Colección exclusiva",

        altTextEn:
          row[2] ||
          row[1] ||
          "Diana Castro - Exclusive collection",

      })
    );


  } catch (error) {

    console.error(
      "Error conectando con Carrusel:",
      error
    );

    return [];

  }
}
