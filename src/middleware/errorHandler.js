const errorHandler = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] ${status}: ${message}`);
  if (isDevelopment && err.stack) {
    console.error(err.stack);
  }

  if (isDevelopment) {
    return res.status(status).json({
      success: false,
      error: message,
      status,
      ...(err.details && { details: err.details }),
      ...(err.stack && { stack: err.stack }),
    });
  }

  return res.status(status).json({
    success: false,
    error: status === 500 ? 'Internal server error' : message,
    status,
  });
};

export default errorHandler;
