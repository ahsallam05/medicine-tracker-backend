import Joi from 'joi';

export const createMedicineSchema = Joi.object({
  name: Joi.string().required().trim().min(2).max(150),
  quantity: Joi.number().integer().min(0).required(),
  expiry_date: Joi.date().iso().required(),
  category: Joi.string().required().trim().max(100),
});

export const updateMedicineSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150),
  quantity: Joi.number().integer().min(0),
  expiry_date: Joi.date().iso(),
  category: Joi.string().trim().max(100),
}).min(1);

export const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('').trim(),
  category: Joi.string().allow('').trim(),
  status: Joi.string().valid('expired', 'active', '').default(''),
  sortBy: Joi.string().valid('name', 'expiry_date', 'quantity', 'created_at').default('created_at'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});
