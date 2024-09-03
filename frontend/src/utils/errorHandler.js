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
      error.response.data.message || 'Server error',
      error.response.status,
      error.response.data.errorCode || 'SERVER_ERROR'
    );
  } else if (error.request) {
    return new AppError('No response from server', 500, 'NO_RESPONSE');
  } else {
    return new AppError(error.message || 'Request setup error', 500, 'REQUEST_SETUP_ERROR');
  }
};