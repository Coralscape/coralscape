export interface GoogleSheetsRow {
  name: string;
  fullImageUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
}

export function parseGoogleSheetsUrl(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export function buildCsvUrl(sheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
}

export function parseCsvData(csvData: string): GoogleSheetsRow[] {
  const rows = csvData.split('\n').slice(1); // Skip header row
  const parsedData: GoogleSheetsRow[] = [];

  for (const row of rows) {
    if (row.trim()) {
      const columns = row.split(',').map(col => col.trim().replace(/"/g, ''));
      
      if (columns.length >= 6) {
        const rowData: GoogleSheetsRow = {
          name: columns[1] || '',
          fullImageUrl: columns[2] || '',
          thumbnailUrl: columns[3] || '',
          width: parseInt(columns[4]) || 0,
          height: parseInt(columns[5]) || 0,
        };

        // Validate required fields
        if (rowData.name && rowData.fullImageUrl && rowData.thumbnailUrl) {
          parsedData.push(rowData);
        }
      }
    }
  }

  return parsedData;
}

export async function fetchGoogleSheetsData(url: string): Promise<GoogleSheetsRow[]> {
  const sheetId = parseGoogleSheetsUrl(url);
  
  if (!sheetId) {
    throw new Error('Invalid Google Sheets URL format');
  }

  const csvUrl = buildCsvUrl(sheetId);
  
  try {
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }
    
    const csvData = await response.text();
    return parseCsvData(csvData);
    
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Google Sheets connection failed: ${error.message}`);
    }
    throw new Error('Unknown error occurred while fetching Google Sheets data');
  }
}
