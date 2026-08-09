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
  showSeriesButton: boolean;
}

export interface CarouselImage {
  imageUrl: string;
  altText: string;
  altTextEn: string;
}

/**
 * Convierte diferentes formatos de imagen
 * en una ruta que Astro pueda utilizar.
 */
function processImageString(rawString: string): string {
  if (!rawString) {
    return "";
  }

  if (rawString.includes("open?id=")) {
    return rawString.replace("open?id=", "uc?id=");
  }

  if (rawString.startsWith("http")) {
    return rawString;
  }

  if (rawString.startsWith("/")) {
    return rawString;
  }

  return `/${rawString}`;
}

/**
 * Convierte el valor de Google Sheets
 * en un booleano.
 *
 * Valores aceptados:
 * SI
 * SÍ
 * YES
 * TRUE
 * 1
 * ON
 */
function parseBoolean(value: string): boolean {
  if (!value) {
    return false;
  }

  const normalized = value
    .toString()
    .trim()
    .toLowerCase();

  return [
    "si",
    "sí",
    "yes",
    "true",
    "1",
    "on"
  ].includes(normalized);
}

/**
 * Obtiene las obras desde Google Sheets.
 *
 * Hoja: Obras
 *
 * A = id
 * B = title
 * C = series
 * D = year
 * E = technique
 * F = dimensions
 * G = availability
 * H = price
 * I = description
 * J = imageUrl
 * K = order
 * L = titleEn
 * M = techniqueEn
 * N = descriptionEn
 * O = showSeriesButton
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

    if (!data.values || !Array.isArray(data.values)) {
      return [];
    }

    return data.values
      .map((row: any[]): Artwork => ({
        id: row[0] || "",

        title: row[1] || "",

        series: row[2] || "",

        year: row[3] || "",

        technique: row[4] || "",

        dimensions: row[5] || "",

        availability: row[6] || "",

        price: row[7] || undefined,

        description: row[8] || "",

        imageUrl: processImageString(
          row[9] || ""
        ),

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

        showSeriesButton:
          parseBoolean(
            row[14] || ""
          )
      }))
      .filter(
        (obra: Artwork) =>
          obra.imageUrl !== ""
      )
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
 * Obtiene las imágenes del carrusel
 * desde la pestaña "Carrusel".
 *
 * A = imageUrl
 * B = altText
 * C = altTextEn
 */
export async function fetchCarousel(): Promise<CarouselImage[]> {
  const SHEET_ID = import.meta.env.GOOGLE_SHEET_ID;
  const API_KEY = import.meta.env.GOOGLE_API_KEY;

  if (!SHEET_ID || !API_KEY) {
    console.error(
      "Faltan GOOGLE_SHEET_ID o GOOGLE_API_KEY."
    );

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

    if (!data.values || !Array.isArray(data.values)) {
      return [];
    }

    return data.values
      .map(
        (row: any[]): CarouselImage => ({
          imageUrl: processImageString(
            row[0] || ""
          ),

          altText:
            row[1] ||
            "Diana Castro - Colección exclusiva",

          altTextEn:
            row[2] ||
            row[1] ||
            "Diana Castro - Exclusive collection"
        })
      )
      .filter(
        (image: CarouselImage) =>
          image.imageUrl !== ""
      );

  } catch (error) {
    console.error(
      "Error conectando con Carrusel:",
      error
    );

    return [];
  }
}
