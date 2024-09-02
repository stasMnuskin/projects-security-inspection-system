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
    // השרת הגיב עם קוד סטטוס שאינו בטווח 2xx
    return new AppError(
      error.response.data.message || 'Server error',
      error.response.status,
      error.response.data.errorCode || 'SERVER_ERROR'
    );
  } else if (error.request) {
    // הבקשה נשלחה אך לא התקבלה תשובה
    return new AppError('No response from server', 500, 'NO_RESPONSE');
  } else {
    // משהו קרה בהגדרת הבקשה שגרם לשגיאה
    return new AppError('Request setup error', 500, 'REQUEST_SETUP_ERROR');
  }
};