/*
  Auth Controller

  Handles HTTP request/response for authentication endpoints.
  - Parses req.body (already validated by middleware)
  - Calls authService
  - Formats and returns response

  Controllers do NOT contain business logic.
  Controllers do NOT touch the database directly.
*/

import AuthService from './auth.service.js';

class AuthController {
  static async login(req, res, next) {
    try {
      const { username, password } = req.body;

      const result = await AuthService.login(username, password);

      return res.json({
        success: true,
        data: {
          token: result.token,
          user: result.user,
        },
      });
    } catch (error) {
      error.statusCode = 401;
      next(error);
    }
  }
}

export default AuthController;
