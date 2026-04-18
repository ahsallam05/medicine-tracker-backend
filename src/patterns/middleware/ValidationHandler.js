/*
  DESIGN PATTERN: CHAIN OF RESPONSIBILITY

  ValidationHandler is the final guard before reaching the controller.

  Responsibility: Validate req.body against a Joi schema.

  If body is invalid → reject with 400 Bad Request (with error details)
  If body is valid → call next()

  Constructor receives a Joi schema object.
  The validated data replaces req.body for the controller.
*/

class ValidationHandler {
  constructor(schema) {
    this.schema = schema;
  }

  handle(req, res, next) {
    const { error, value } = this.schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = {};
      error.details.forEach((err) => {
        details[err.path.join('.')] = err.message;
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details,
      });
    }

    req.body = value;
    next();
  }
}

export default ValidationHandler;
