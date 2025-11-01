import apiClient from './client';
import { RouteRequest, RouteOption } from '../types';

interface RouteSearchResponse {
  routes: RouteOption[];
  count: number;
}

export const routeAPI = {
  /**
   * Rota arama
   */
  search: async (request: RouteRequest): Promise<RouteSearchResponse> => {
    const response = await apiClient.post<any, any>('/routes/search', request);
    return response.data;
  },

  /**
   * Rota detayı
   */
  getById: async (routeId: string): Promise<RouteOption> => {
    const response = await apiClient.get<any, any>(`/routes/${routeId}`);
    return response.data.route;
  },
};
