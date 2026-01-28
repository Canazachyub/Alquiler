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
