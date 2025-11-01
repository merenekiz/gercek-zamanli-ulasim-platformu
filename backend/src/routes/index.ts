import { Router } from 'express';
import authRoutes from './auth';
import routeRoutes from './routes';
// Import diğer route'lar buraya eklenecek
// import taxiRoutes from './taxi';
// import transitRoutes from './transit';
// import placeRoutes from './places';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
router.use('/auth', authRoutes);

// Route planning routes
router.use('/routes', routeRoutes);

// Diğer route'lar buraya eklenecek
// router.use('/taxi', taxiRoutes);
// router.use('/transit', transitRoutes);
// router.use('/places', placeRoutes);

export default router;
