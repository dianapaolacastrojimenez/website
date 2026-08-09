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
 * en una ruta válida para Astro.
 *
 * Ejemplos:
 *
 * /obra.jpg
 * public/obra.jpg
 * /public/obra.jpg
 * obras/obra.jpg
 *
 * terminan funcionando como:
 *
 * /obra.jpg
 * /obras/obra.jpg
 */
function processImageString(rawString: string): string {
  if (!rawString) return "";

  let value = String(rawString).trim();

  if (!value) return "";

  // Google Drive antiguo
  if (value.includes("open?id=")) {
    return value.replace("open?id=", "uc?id=");
  }

  // Google Drive file URL
  if (
    value.includes("drive.google.com") ||
    value.includes("googleusercontent.com")
  ) {
    return value;
  }

  // URL absoluta
  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  // Astro sirve directamente la carpeta /public
  // Por eso eliminamos "public/" si el usuario lo escribió.
  value = value.replace(/^public[\\/]/i, "");

  // Normalizamos barras
  value = value.replace(/\\/g, "/");

  // Aseguramos que empiece por /
  if (!value.startsWith("/")) {
    value = `/${value}`;
  }

  return value;
}


/**
 * Convierte el contenido de la columna
 * "Mostrar botón serie" en verdadero/falso.
 *
 * Acepta:
 * SI
 * SÍ
 * si
 * sí
 * TRUE
 * true
 * 1
 * YES
 * ON
 */
function parseBoolean(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  const normalized = String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return [
    "si",
    "true",
    "1",
    "yes",
    "on",
    "mostrar",
    "mostrar boton",
    "mostrar boton serie",
  ].includes(normalized);
}


/**
 * Descarga las obras desde Google Sheets.
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

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/` +
    `${SHEET_ID}/values/Obras!A2:O?key=${API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        "Google Sheets respondió con error:",
        response.status,
        response.statusText
      );

      return [];
    }

    const data = await response.json();

    if (!data.values || !Array.isArray(data.values)) {
      return [];
    }

    return data.values
      .map((row: any[]) => {
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

          description: String(row[8] ?? "").trim(),

          imageUrl: processImageString(
            String(row[9] ?? "")
          ),

          order: Number.parseInt(
            String(row[10] ?? "0"),
            10
          ) || 0,

          titleEn:
            String(row[11] ?? "").trim() ||
            String(row[1] ?? "").trim(),

          techniqueEn:
            String(row[12] ?? "").trim() ||
            String(row[4] ?? "").trim(),

          descriptionEn:
            String(row[13] ?? "").trim() ||
            String(row[8] ?? "").trim(),

          showSeriesButton: parseBoolean(row[14]),
        };
      })
      .filter((obra: Artwork) => {
        // No mostramos filas completamente vacías.
        return (
          obra.id ||
          obra.title ||
          obra.imageUrl
        );
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
 * Descarga las imágenes del carrusel principal.
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
      console.error(
        "Google Sheets Carrusel respondió con error:",
        response.status,
        response.statusText
      );

      return [];
    }

    const data = await response.json();

    if (!data.values || !Array.isArray(data.values)) {
      return [];
    }

    return data.values
      .map((row: any[]) => ({
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
      }))
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
