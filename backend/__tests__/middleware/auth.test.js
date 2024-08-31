const AppError = require('../../src/utils/appError');
const auth = require('../../src/middleware/auth');
const { User } = require('../../src/models');
const jwt = require('jsonwebtoken');

jest.mock('../../src/models');
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    mockRequest = {
      header: jest.fn()
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  it('should call next with error if no token is provided', async () => {
    mockRequest.header.mockReturnValue(null);

    await auth(mockRequest, mockResponse, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    expect(nextFunction.mock.calls[0][0].statusCode).toBe(401);
  });

  it('should call next with error if token is invalid', async () => {
    mockRequest.header.mockReturnValue('invalid-token');
    jwt.verify.mockImplementation(() => { throw new Error(); });

    await auth(mockRequest, mockResponse, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    expect(nextFunction.mock.calls[0][0].statusCode).toBe(401);
  });

  it('should call next with error if user is not found', async () => {
    const token = 'valid-token';
    mockRequest.header.mockReturnValue(token);
    jwt.verify.mockReturnValue({ id: 1 });
    User.findByPk.mockResolvedValue(null);

    await auth(mockRequest, mockResponse, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    expect(nextFunction.mock.calls[0][0].statusCode).toBe(404);
  });
});