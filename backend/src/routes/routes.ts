import { Router } from 'express';
import * as routeController from '../controllers/routeController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/v1/routes/search
 * @desc    Rota arama
 * @access  Public (optional auth)
 */
router.post('/search', optionalAuth, routeController.searchRoutes);

export default router;
