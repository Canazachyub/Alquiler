/**
 * Comprime una imagen en el navegador antes de subirla.
 *
 * Una foto de celular pesa 3-8 MB. Sin comprimir, el base64 haria que Apps Script
 * tarde demasiado o corte la subida. A 1280px de ancho y calidad 0.72 un DNI
 * queda perfectamente legible en 100-250 KB.
 *
 * Devuelve un data URL (`data:image/jpeg;base64,...`); el backend le quita el prefijo.
 */
export async function comprimirImagen(
  file: File,
  maxAncho = 1280,
  calidad = 0.72
): Promise<string> {
  const bitmap = await cargarBitmap(file);

  const escala = Math.min(1, maxAncho / bitmap.width);
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen');

  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close();

  return canvas.toDataURL('image/jpeg', calidad);
}

/**
 * createImageBitmap con imageOrientation: 'from-image' aplica la rotacion EXIF,
 * que es lo que hace que las fotos de celular no salgan acostadas.
 * Si el navegador no lo soporta, cae a <img>, que en navegadores modernos
 * tambien respeta la orientacion.
 */
async function cargarBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Sigue al fallback
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };
    img.src = url;
  });
}

/** Peso aproximado en KB de un data URL base64, para mostrarlo en la UI. */
export function pesoKb(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.round((base64.length * 3) / 4 / 1024);
}

/** Convierte un Blob/File a data URL, para subir PDFs ya generados. */
export function archivoADataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}
