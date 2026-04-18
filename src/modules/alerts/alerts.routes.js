import express from 'express';
import AlertsController from './alerts.controller.js';
import { authenticate } from '../../patterns/middleware/index.js';

const router = express.Router();

// Apply authentication to all alert routes
router.use(authenticate);

// Get all computed alerts
router.get('/', AlertsController.getAlerts);

export default router;
