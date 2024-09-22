export class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleApiError = (error) => {
  if (error.response) {
    return new AppError(
      error.response.data.message || 'שגיאת שרת',
      error.response.status,
      error.response.data.errorCode || 'SERVER_ERROR'
    );
  } else if (error.request) {
    return new AppError('אין תגובה מהשרת', 500, 'NO_RESPONSE');
  } else {
    return new AppError(error.message || 'שגיאה בהגדרת הבקשה', 500, 'REQUEST_SETUP_ERROR');
  }
};