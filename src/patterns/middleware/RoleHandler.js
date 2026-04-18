/*
  DESIGN PATTERN: CHAIN OF RESPONSIBILITY

  RoleHandler checks the second guard in the validation chain.

  Responsibility: Verify that the authenticated user's role is in the allowed list.

  If user role is not allowed → reject with 403 Forbidden
  If user role is allowed → call next()

  Constructor receives the list of allowed roles (e.g., ['admin', 'pharmacist']).
  This same handler instance is reused on multiple routes with different role lists.
*/

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
