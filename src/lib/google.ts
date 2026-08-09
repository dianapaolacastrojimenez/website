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


function processImageString(rawString: string): string {
  if (!rawString) return "";

  const value = String(rawString).trim();

  if (!value) return "";

  // Rutas locales dentro de /public
  if (value.startsWith("/")) {
    return value;
  }

  // URLs externas
  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  // Cualquier otro nombre de archivo
  return `/${value}`;
}


/**
 * Convierte el valor de Google Sheets
 * SI / NO
 * en true / false.
 */
function parseBoolean(value: unknown): boolean {
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


export async function fetchArtworks(): Promise<Artwork[]> {

  const SHEET_ID = import.meta.env.GOOGLE_SHEET_ID;
  const API_KEY = import.meta.env.GOOGLE_API_KEY;

  if (!SHEET_ID || !API_KEY) {
    console.error(
      "Faltan GOOGLE_SHEET_ID o GOOGLE_API_KEY"
    );

    return [];
  }


  /*
   * IMPORTANTE:
   *
   * Ahora leemos hasta O.
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

          price: row[7] || undefined,

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
           * COLUMNA O
           *
           * SI = true
           * NO = false
           */
          showSeriesButton:
            parseBoolean(row[14]),

        };

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
