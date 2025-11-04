import { Request, Response, NextFunction } from 'express';
import routeService from '../services/routeService';
import { ApiResponse, AuthenticatedRequest, RouteRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

/**
 * Rota arama
 * POST /api/v1/routes/search
 */
export const searchRoutes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestData: RouteRequest = req.body;

    console.log('[RouteController] Received search request:', {
      origin: requestData.origin,
      destination: requestData.destination,
      modes: requestData.modes,
    });

    // Validation
    if (!requestData.origin || !requestData.destination) {
      throw new AppError('Başlangıç ve varış noktaları zorunludur', 400);
    }

    if (!requestData.modes || requestData.modes.length === 0) {
      throw new AppError('En az bir ulaşım modu seçilmelidir', 400);
    }

    // Rota ara
    const routes = await routeService.searchRoutes(requestData);

    const response: ApiResponse = {
      success: true,
      data: {
        routes,
        count: routes.length,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
