// ============================================================
// src/lib/google.ts
// ============================================================

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

  /*
   * Columna O de Google Sheets:
   * "Mostrar botón serie"
   */
  showSeriesButton: boolean;
}


export interface CarouselImage {
  imageUrl: string;
  altText: string;
  altTextEn: string;
}


/**
 * Convierte diferentes formatos de rutas de imágenes
 * provenientes de Google Sheets en rutas utilizables
 * por Astro.
 */
function processImageString(rawString: string): string {

  if (!rawString) {
    return "";
  }

  let value = String(rawString).trim();

  /*
   * Google Drive antiguo:
   *
   * https://drive.google.com/open?id=XXXXX
   *
   * se convierte en:
   *
   * https://drive.google.com/uc?id=XXXXX
   */
  if (value.includes("open?id=")) {
    return value.replace(
      "open?id=",
      "uc?id="
    );
  }


  /*
   * Si es una URL completa, la dejamos intacta.
   */
  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }


  /*
   * IMPORTANTE:
   *
   * Los archivos que están dentro de:
   *
   * public/obras/...
   *
   * NO se llaman desde el navegador como:
   *
   * /public/obras/...
   *
   * sino como:
   *
   * /obras/...
   *
   * Por eso eliminamos "public/".
   */
  value = value.replace(
    /^public\//i,
    ""
  );


  /*
   * Si ya empieza con "/", está listo.
   */
  if (value.startsWith("/")) {
    return value;
  }


  /*
   * Para cualquier otra ruta local,
   * añadimos "/".
   */
  return `/${value}`;
}


/**
 * Convierte el valor de la columna
 * "Mostrar botón serie" a boolean.
 *
 * Admite:
 *
 * SI
 * Sí
 * si
 * YES
 * yes
 * TRUE
 * true
 * 1
 * X
 */
function parseShowSeriesButton(
  value: unknown
): boolean {

  if (value === true) {
    return true;
  }

  if (value === false) {
    return false;
  }

  if (
    value === undefined ||
    value === null
  ) {
    return false;
  }

  const normalized =
    String(value)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );

  return (
    normalized === "si" ||
    normalized === "yes" ||
    normalized === "true" ||
    normalized === "1" ||
    normalized === "x"
  );
}


/**
 * Obtiene las obras desde Google Sheets.
 *
 * Estructura actual de la hoja "Obras":
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

  const SHEET_ID =
    import.meta.env.GOOGLE_SHEET_ID;

  const API_KEY =
    import.meta.env.GOOGLE_API_KEY;


  if (
    !SHEET_ID ||
    !API_KEY
  ) {

    console.error(
      "Faltan GOOGLE_SHEET_ID o GOOGLE_API_KEY."
    );

    return [];
  }


  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/` +
    `${SHEET_ID}/values/Obras!A2:O?key=${API_KEY}`;


  try {

    const response =
      await fetch(url);


    if (!response.ok) {

      throw new Error(
        `Google Sheets respondió con HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    if (
      !data ||
      !Array.isArray(data.values)
    ) {

      console.warn(
        "Google Sheets no devolvió filas para la pestaña Obras."
      );

      return [];

    }


    const artworks: Artwork[] =
      data.values
        .map(
          (
            row: any[],
            index: number
          ) => {

            /*
             * Columna O
             *
             * Índice 14 porque:
             *
             * A = 0
             * B = 1
             * ...
             * O = 14
             */
            const rawShowButton =
              row[14] !== undefined &&
              row[14] !== null
                ? String(row[14]).trim()
                : "";


            const showSeriesButton =
              parseShowSeriesButton(
                rawShowButton
              );


            /*
             * Información útil durante el build.
             * Aparecerá en los logs de GitHub Actions.
             */
            console.log(
              `[Google Sheets] Fila ${index + 2}`,
              `| Obra: ${row[1] || ""}`,
              `| Serie: ${row[2] || ""}`,
              `| Mostrar botón: ${rawShowButton}`,
              `| Resultado: ${showSeriesButton}`
            );


            return {

              id:
                row[0] ||
                "",


              title:
                row[1] ||
                "",


              series:
                row[2] ||
                "",


              year:
                row[3] ||
                "",


              technique:
                row[4] ||
                "",


              dimensions:
                row[5] ||
                "",


              availability:
                row[6] ||
                "",


              price:
                row[7] ||
                undefined,


              description:
                row[8] ||
                "",


              imageUrl:
                processImageString(
                  row[9] ||
                  ""
                ),


              order:
                parseInt(
                  row[10] ||
                  "0",
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
               * columna O
               */
              showSeriesButton,

            };

          }
        )
        .sort(
          (
            a: Artwork,
            b: Artwork
          ) =>
            a.order -
            b.order
        );


    return artworks;


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
 * A = imagen
 * B = altText
 * C = altTextEn
 */
export async function fetchCarousel(): Promise<CarouselImage[]> {

  const SHEET_ID =
    import.meta.env.GOOGLE_SHEET_ID;

  const API_KEY =
    import.meta.env.GOOGLE_API_KEY;


  if (
    !SHEET_ID ||
    !API_KEY
  ) {

    console.error(
      "Faltan GOOGLE_SHEET_ID o GOOGLE_API_KEY."
    );

    return [];

  }


  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/` +
    `${SHEET_ID}/values/Carrusel!A2:C?key=${API_KEY}`;


  try {

    const response =
      await fetch(url);


    if (!response.ok) {

      throw new Error(
        `Google Sheets respondió con HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    if (
      !data ||
      !Array.isArray(data.values)
    ) {

      console.warn(
        "Google Sheets no devolvió filas para la pestaña Carrusel."
      );

      return [];

    }


    return data.values.map(
      (row: any[]) => ({

        imageUrl:
          processImageString(
            row[0] ||
            ""
          ),


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
