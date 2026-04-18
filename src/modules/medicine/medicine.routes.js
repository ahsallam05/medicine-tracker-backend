import express from 'express';
import MedicineController from './medicine.controller.js';
import { authenticate, authorize, validate } from '../../patterns/middleware/index.js';
import { createMedicineSchema, updateMedicineSchema, querySchema } from './medicine.schema.js';

const router = express.Router();

// Apply authentication to all medicine routes
router.use(authenticate);

// List all medicines with search, filter, sort, and pagination
router.get('/', validate(querySchema), MedicineController.getAll);

// Create a new medicine (both admin and pharmacist can create)
router.post('/', validate(createMedicineSchema), MedicineController.create);

// Get a single medicine by ID
router.get('/:id', MedicineController.getById);

// Update a medicine (both roles)
router.put('/:id', validate(updateMedicineSchema), MedicineController.update);

// Delete a medicine (both roles)
router.delete('/:id', MedicineController.delete);

export default router;
