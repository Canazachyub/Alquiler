// Repositorio base para acceso a Google Sheets

class BaseRepository {
  protected spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;
  protected sheetName: string;
  protected headers: string[];

  constructor(sheetName: string, headers: string[]) {
    this.spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    this.sheetName = sheetName;
    this.headers = headers;
  }

  protected getSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    let sheet = this.spreadsheet.getSheetByName(this.sheetName);
    if (!sheet) {
      sheet = this.spreadsheet.insertSheet(this.sheetName);
      sheet.appendRow(this.headers);
      sheet.getRange(1, 1, 1, this.headers.length).setFontWeight('bold');
    }
    return sheet;
  }

  protected getAllData(): unknown[][] {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    return sheet.getRange(2, 1, lastRow - 1, this.headers.length).getValues();
  }

  // Convierte header a camelCase, manejando acrónimos como DNI, ID
  private headerToKey(header: string): string {
    // Si es todo mayúsculas (acrónimo), convertir a minúsculas
    if (header === header.toUpperCase()) {
      return header.toLowerCase();
    }
    // PascalCase a camelCase estándar
    return header.charAt(0).toLowerCase() + header.slice(1);
  }

  protected rowToObject<T>(row: unknown[]): T {
    const obj: Record<string, unknown> = {};
    this.headers.forEach((header, index) => {
      const key = this.headerToKey(header);
      let value = row[index];

      // Convertir fechas a ISO string
      if (value instanceof Date) {
        value = value.toISOString();
      }

      obj[key] = value;
    });
    return obj as T;
  }

  protected objectToRow(obj: Record<string, unknown>): unknown[] {
    // Crear mapa de claves en minúsculas para búsqueda case-insensitive
    const objLowerKeys = new Map<string, string>();
    Object.keys(obj).forEach(k => objLowerKeys.set(k.toLowerCase(), k));

    return this.headers.map((header) => {
      const headerLower = header.toLowerCase();
      const actualKey = objLowerKeys.get(headerLower);
      const value = actualKey ? obj[actualKey] : undefined;

      // Convertir strings de fecha a Date
      if (typeof value === 'string' && header.toLowerCase().includes('fecha')) {
        return new Date(value);
      }

      return value ?? '';
    });
  }

  protected findRowIndex(id: string): number {
    const data = this.getAllData();
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === id) {
        return i + 2; // +2 porque empezamos en fila 2 (después de headers)
      }
    }
    return -1;
  }

  getAll<T>(): T[] {
    const data = this.getAllData();
    return data.map((row) => this.rowToObject<T>(row));
  }

  getById<T>(id: string): T | null {
    const data = this.getAllData();
    for (const row of data) {
      if (row[0] === id) {
        return this.rowToObject<T>(row);
      }
    }
    return null;
  }

  create<T>(data: Record<string, unknown>): T {
    const sheet = this.getSheet();
    const id = data.id || generateId(this.sheetName.charAt(0).toUpperCase());
    const now = new Date().toISOString();

    const fullData = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    const row = this.objectToRow(fullData);
    sheet.appendRow(row);

    return this.rowToObject<T>(row);
  }

  update<T>(id: string, data: Record<string, unknown>): T | null {
    const sheet = this.getSheet();
    const rowIndex = this.findRowIndex(id);

    if (rowIndex === -1) return null;

    const currentRow = sheet.getRange(rowIndex, 1, 1, this.headers.length).getValues()[0];
    const currentObj = this.rowToObject<Record<string, unknown>>(currentRow);

    const updatedObj = {
      ...currentObj,
      ...data,
      id, // Mantener ID original
      updatedAt: new Date().toISOString(),
    };

    const newRow = this.objectToRow(updatedObj);
    sheet.getRange(rowIndex, 1, 1, this.headers.length).setValues([newRow]);

    return this.rowToObject<T>(newRow);
  }

  delete(id: string): boolean {
    const sheet = this.getSheet();
    const rowIndex = this.findRowIndex(id);

    if (rowIndex === -1) return false;

    sheet.deleteRow(rowIndex);
    return true;
  }

  getByField<T>(fieldName: string, value: unknown): T[] {
    const fieldIndex = this.headers.findIndex(
      (h) => h.toLowerCase() === fieldName.toLowerCase()
    );

    if (fieldIndex === -1) return [];

    const data = this.getAllData();
    return data
      .filter((row) => row[fieldIndex] === value)
      .map((row) => this.rowToObject<T>(row));
  }
}
