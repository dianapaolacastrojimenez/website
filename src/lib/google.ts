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
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const API_KEY = process.env.GOOGLE_API_KEY;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Obras!A2:K?key=${API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  return data.values.map((row: any[]) => ({
    id: row[0],
    title: row[1],
    series: row[2],
    year: row[3],
    technique: row[4],
    dimensions: row[5],
    availability: row[6],
    price: row[7] || null,
    description: row[8],
    imageUrl: row[9].replace('open?id=', 'uc?id='), // Formato correcto para Drive
    order: parseInt(row[10], 10),
  })).sort((a, b) => a.order - b.order);
}
