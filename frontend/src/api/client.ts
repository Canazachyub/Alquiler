import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types';
import { API_URL } from '@/utils/constants';

// Crear instancia de axios
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 segundos (Apps Script puede ser lento)
});

// Interceptor de request
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de response
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    const message = error.response?.data?.error || error.message || 'Error de conexión';
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
  }
);

/**
 * Google Apps Script no maneja bien CORS con POST requests.
 * Solución: Enviar todo como GET con los datos codificados en query params.
 */
async function apiRequest<T>(
  action: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: unknown,
  extraParams?: Record<string, unknown>
): Promise<T> {
  // Construir parámetros
  const params: Record<string, string> = {
    action,
    endpoint,
  };

  // Agregar parámetros extra (para GET con filtros)
  if (extraParams) {
    Object.entries(extraParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params[key] = String(value);
      }
    });
  }

  // Para POST/PUT/DELETE, enviar data como JSON string
  if (data && (action === 'POST' || action === 'PUT')) {
    params['data'] = JSON.stringify(data);
  }

  const response = await apiClient.get<ApiResponse<T>>('', { params });

  if (!response.data.success) {
    throw new Error(response.data.error || 'Error en la petición');
  }

  return response.data.data as T;
}

/**
 * POST real con el payload en el cuerpo, para cargas que no caben en una URL
 * (imagenes y PDFs en base64 pesan cientos de KB).
 *
 * El Content-Type es 'text/plain' a proposito: convierte la peticion en una
 * "simple request" y evita el preflight OPTIONS, que Apps Script no responde.
 * NO cambiar a 'application/json' — rompe CORS.
 */
export async function apiPostBody<T>(
  action: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data: unknown
): Promise<T> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, endpoint, data }),
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Error de red (${response.status})`);
  }

  const payload = (await response.json()) as ApiResponse<T>;
  if (!payload.success) {
    throw new Error(payload.error || 'Error en la petición');
  }
  return payload.data as T;
}

// Funciones helper para las peticiones
export async function apiGet<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
  return apiRequest<T>('GET', endpoint, undefined, config?.params);
}

export async function apiPost<T, D = unknown>(endpoint: string, data: D): Promise<T> {
  return apiRequest<T>('POST', endpoint, data);
}

export async function apiPut<T, D = unknown>(endpoint: string, data: D): Promise<T> {
  return apiRequest<T>('PUT', endpoint, data);
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>('DELETE', endpoint);
}

export default apiClient;
