class AppError extends Error {
  constructor(message, statusCode, errorCode, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.errorCode = errorCode;

    this.timestamp = new Date().toISOString();
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message, errorCode = 'BAD_REQUEST') {
    return new AppError(message, 400, errorCode);
  }

  static unauthorized(message, errorCode = 'UNAUTHORIZED') {
    return new AppError(message, 401, errorCode);
  }

  static forbidden(message, errorCode = 'FORBIDDEN') {
    return new AppError(message, 403, errorCode);
  }

  static notFound(message, errorCode = 'NOT_FOUND') {
    return new AppError(message, 404, errorCode);
  }

  static internalError(message, errorCode = 'INTERNAL_ERROR') {
    return new AppError(message, 500, errorCode, true);
  }

  addMetadata(key, value) {
    this[key] = value;
    return this;
  }

  setRequestDetails(req) {
    this.path = req.originalUrl || req.url;
    this.method = req.method;
    return this;
  }

  toJSON() {
    return {
      status: this.status,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      isOperational: this.isOperational,
      message: this.message,
      timestamp: this.timestamp,
      path: this.path,
      method: this.method,
      stack: this.stack
    };
  }
}

module.exports = AppError;