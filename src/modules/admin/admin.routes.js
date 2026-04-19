import express from 'express';
import AdminController from './admin.controller.js';
import { authenticate, authorize, validate } from '../../patterns/middleware/index.js';
import Joi from 'joi';

const router = express.Router();

const createPharmacistSchema = Joi.object({
  name: Joi.string().required().trim().min(2).max(100),
  username: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).required().trim().min(3).max(50).messages({
    'string.pattern.base': 'Username can only contain letters, numbers, underscores, and hyphens',
  }),
  password: Joi.string().required().min(6),
});

const toggleStatusSchema = Joi.object({
  is_active: Joi.boolean().required(),
});

const updatePharmacistSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  username: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).trim().min(2).max(50).messages({
    'string.pattern.base': 'Username can only contain letters, numbers, underscores, and hyphens',
  }),
  password: Joi.string().min(6),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

// Apply authentication and admin-only authorization to all admin routes
router.use(authenticate);
router.use(authorize(['admin']));

// Create pharmacist account
router.post('/pharmacists', validate(createPharmacistSchema), AdminController.createPharmacist);

// View all pharmacists
router.get('/pharmacists', AdminController.getAllPharmacists);

// Deactivate/reactivate pharmacist account
router.patch('/pharmacists/:id/status', validate(toggleStatusSchema), AdminController.togglePharmacistStatus);

// Delete pharmacist account
router.delete('/pharmacists/:id', AdminController.deletePharmacist);

// Update pharmacist account
router.put('/pharmacists/:id', validate(updatePharmacistSchema), AdminController.updatePharmacist);

export default router;
