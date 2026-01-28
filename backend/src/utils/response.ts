// Utilidades para respuestas de API

function jsonResponse<T>(data: ApiResponse<T>): GoogleAppsScript.Content.TextOutput {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function successResponse<T>(data: T, message?: string): GoogleAppsScript.Content.TextOutput {
  return jsonResponse({
    success: true,
    data,
    message,
  });
}

function errorResponse(error: string): GoogleAppsScript.Content.TextOutput {
  return jsonResponse({
    success: false,
    error,
  });
}

function generateId(prefix: string = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

function formatDateISO(date: Date): string {
  return date.toISOString();
}
