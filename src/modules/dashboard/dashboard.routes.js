import express from 'express';
import DashboardController from './dashboard.controller.js';
import { authenticate } from '../../patterns/middleware/index.js';

const router = express.Router();

// Apply authentication to all dashboard routes
router.use(authenticate);

// Get dashboard statistics
router.get('/stats', DashboardController.getDashboardStats);

export default router;
