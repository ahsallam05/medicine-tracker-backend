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
