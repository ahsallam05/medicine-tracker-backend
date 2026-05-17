class RoleHandler {
  constructor(allowedRoles = []) {
    this.allowedRoles = allowedRoles;
  }

  handle(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!this.allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for this action',
      });
    }

    next();
  }
}

export default RoleHandler;
