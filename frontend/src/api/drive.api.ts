import { apiGet, apiPostBody } from './client';
import type { DocumentoDriveResult, SubirDocumentoInput, TipoDocumentoDrive } from '@/types';

const ENDPOINT = '/api/drive/documento';

export const driveApi = {
  /**
   * Sube un documento a Drive. Va por POST con cuerpo porque el base64
   * de una imagen o un PDF no entra en una query string.
   */
  subir: (data: SubirDocumentoInput) =>
    apiPostBody<DocumentoDriveResult>('POST', ENDPOINT, data),

  /**
   * Consulta el enlace ya guardado. Sirve para confirmar una subida
   * cuando la respuesta del POST no se pudo leer.
   */
  consultar: (tipo: TipoDocumentoDrive, ids: { inquilinoId?: string; pagoId?: string }) =>
    apiGet<{ tipo: TipoDocumentoDrive; url: string | null }>(ENDPOINT, {
      params: { tipo, ...ids },
    }),
};
