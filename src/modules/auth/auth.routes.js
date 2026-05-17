import express from 'express';
import AuthController from './auth.controller.js';
import { validate } from '../../patterns/middleware/index.js';
import { loginSchema } from './auth.schema.js';

const router = express.Router();

router.post('/login', validate(loginSchema), (req, res, next) => {
  AuthController.login(req, res, next);
});

export default router;
