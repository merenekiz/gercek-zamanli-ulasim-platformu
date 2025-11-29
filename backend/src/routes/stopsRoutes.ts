import { Router, Request, Response } from 'express';
import transitStopsService from '../services/transitStopsService';

const router = Router();

/**
 * GET /api/v1/stops/nearby
 * Yakındaki durakları getir
 */
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Location parameters (lat, lng) are required',
      });
    }

    const location = {
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string),
    };

    const searchRadius = radius ? parseInt(radius as string) : 500;

    const stops = await transitStopsService.getNearbyStops(location, searchRadius);

    res.json({
      success: true,
      data: stops,
    });
  } catch (error: any) {
    console.error('[StopsController] Error in nearby stops:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch nearby stops',
    });
  }
});

/**
 * POST /api/v1/stops/along-route
 * Rota üzerindeki durakları getir
 */
router.post('/along-route', async (req: Request, res: Response) => {
  try {
    const { polyline, transitMode, routeName } = req.body;

    if (!polyline || !transitMode) {
      return res.status(400).json({
        success: false,
        error: 'Polyline and transitMode are required',
      });
    }

    if (!['BUS', 'METRO', 'ANKARAY'].includes(transitMode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transit mode. Must be BUS, METRO, or ANKARAY',
      });
    }

    const stops = await transitStopsService.getStopsAlongRoute(
      polyline,
      transitMode,
      routeName // Route name ekledik (örn: "442", "M1")
    );

    res.json({
      success: true,
      data: stops,
    });
  } catch (error: any) {
    console.error('[StopsController] Error fetching stops along route:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch stops along route',
    });
  }
});

/**
 * GET /api/v1/stops/:stopId
 * Durak detaylarını getir
 */
router.get('/:stopId', async (req: Request, res: Response) => {
  try {
    const { stopId } = req.params;

    const stop = await transitStopsService.getStopDetails(stopId);

    if (!stop) {
      return res.status(404).json({
        success: false,
        error: 'Stop not found',
      });
    }

    res.json({
      success: true,
      data: stop,
    });
  } catch (error: any) {
    console.error('[StopsController] Error fetching stop details:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch stop details',
    });
  }
});

export default router;
