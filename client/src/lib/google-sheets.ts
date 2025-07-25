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

export function buildCsvUrl(sheetId: string, gid?: string): string {
  const baseUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  return gid ? `${baseUrl}&gid=${gid}` : baseUrl;
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

export async function fetchWatermarkFromSheets(url: string): Promise<string | null> {
  const sheetId = parseGoogleSheetsUrl(url);
  
  if (!sheetId) {
    throw new Error('Invalid Google Sheets URL format');
  }

  // For sheet 2, we need to use a specific gid. Common gids for sheet 2 are "0" for sheet 1, and various numbers for subsequent sheets
  // We'll try different approaches to get sheet 2
  const possibleGids = ['1', '2000000000', '1555555555', '669674685']; // Common gids for second sheets
  
  for (const gid of possibleGids) {
    try {
      const csvUrl = buildCsvUrl(sheetId, gid);
      const response = await fetch(csvUrl);
      
      if (response.ok) {
        const csvData = await response.text();
        const rows = csvData.split('\n');
        
        if (rows.length > 0) {
          const firstRow = rows[0];
          const columns = firstRow.split(',').map(col => col.trim().replace(/"/g, ''));
          
          if (columns.length > 0 && columns[0]) {
            return columns[0]; // Return the value from column A, row 1
          }
        }
      }
    } catch (error) {
      continue; // Try next gid
    }
  }
  
  return null; // No watermark found
}
