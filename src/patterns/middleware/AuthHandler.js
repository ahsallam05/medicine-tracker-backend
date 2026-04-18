/*
  DESIGN PATTERN: CHAIN OF RESPONSIBILITY

  AuthHandler is the first handler in the request validation chain.

  Responsibility: Extract and verify JWT token from the Authorization header.

  If token is missing, malformed, or expired → reject with 401 Unauthorized
  If token is valid → attach user data to req.user and call next()

  The next handler in the chain receives the validated request.
*/

import jwt from 'jsonwebtoken';
import Database from '../../config/Database.js';

class AuthHandler {
  static async handle(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Missing or invalid authorization header',
        });
      }

      const token = authHeader.slice(7);

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            error: 'Token expired',
          });
        }
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
        });
      }

      const user = await Database.queryOne(
        'SELECT id, username, role, is_active FROM users WHERE id = $1',
        [decoded.id]
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
        });
      }

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          error: 'Account is deactivated',
        });
      }

      req.user = {
        id: user.id,
        username: user.username,
        role: user.role,
      };

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Authentication error',
      });
    }
  }
}

export default AuthHandler;
