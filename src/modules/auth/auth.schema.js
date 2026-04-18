/*
  Auth Validation Schemas (Joi)

  Joi schemas validate request bodies before they reach controllers.
  These are passed to ValidationHandler middleware.

  Joi provides:
  - Type checking (string, number, etc.)
  - Required/optional fields
  - Length constraints
  - Custom error messages
*/

import Joi from 'joi';

export const loginSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required().messages({
    'string.empty': 'Username is required',
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username cannot exceed 50 characters',
    'string.alphanum': 'Username must contain only letters and numbers',
  }),
  password: Joi.string().min(6).max(255).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),
}).unknown(false);

export const createUserSchema = Joi.object({
  name: Joi.string().max(100).required().messages({
    'string.empty': 'Name is required',
    'string.max': 'Name cannot exceed 100 characters',
  }),
  username: Joi.string().alphanum().min(3).max(50).required().messages({
    'string.empty': 'Username is required',
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username cannot exceed 50 characters',
    'string.alphanum': 'Username must contain only letters and numbers',
  }),
  password: Joi.string().min(6).max(255).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),
  role: Joi.string().valid('admin', 'pharmacist').default('pharmacist'),
}).unknown(false);
