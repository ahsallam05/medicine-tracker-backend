/*
  Middleware Export Utilities

  Provides easy-to-use wrapper functions for the middleware handlers.
  These wrappers are used in route definitions.
*/

import AuthHandler from './AuthHandler.js';
import RoleHandler from './RoleHandler.js';
import ValidationHandler from './ValidationHandler.js';

export const authenticate = (req, res, next) => {
  AuthHandler.handle(req, res, next);
};

export const authorize = (allowedRoles) => {
  const roleHandler = new RoleHandler(allowedRoles);
  return (req, res, next) => {
    roleHandler.handle(req, res, next);
  };
};

export const validate = (schema) => {
  const validationHandler = new ValidationHandler(schema);
  return (req, res, next) => {
    validationHandler.handle(req, res, next);
  };
};

export default {
  authenticate,
  authorize,
  validate,
};
