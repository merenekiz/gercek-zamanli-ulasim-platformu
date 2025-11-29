import { Router, Request, Response } from 'express';
import attractionsService from '../services/attractionsService';

const router = Router();

/**
 * GET /api/v1/attractions/nearby
 * Yakındaki gezilecek yerleri getir
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

    const searchRadius = radius ? parseInt(radius as string) : 1500;

    const attractions = await attractionsService.getNearbyAttractions(
      location,
      searchRadius
    );

    res.json({
      success: true,
      data: attractions,
    });
  } catch (error: any) {
    console.error('[AttractionsController] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch attractions',
    });
  }
});

export default router;
