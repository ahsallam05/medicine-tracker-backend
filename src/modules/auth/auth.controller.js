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
