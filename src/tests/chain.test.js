jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('../config/Database.js', () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(),
    query:       jest.fn(),
    queryOne:    jest.fn(),
    queryAll:    jest.fn(),
    close:       jest.fn(),
  },
}));

import jwt from 'jsonwebtoken';
import Database from '../config/Database.js';
import AuthHandler from '../patterns/middleware/AuthHandler.js';
import RoleHandler from '../patterns/middleware/RoleHandler.js';
import ValidationHandler from '../patterns/middleware/ValidationHandler.js';
import { createMedicineSchema } from '../modules/medicine/medicine.schema.js';

// Minimal Express-like req object
const mockReq = ({ headers = {}, user = undefined, body = {} } = {}) => ({
  headers,
  user,
  body,
});

/**
 * Chainable Express-like res object.
 * res.status(401).json({...}) works because status() returns res itself.
 */
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

// AUTH HANDLER
describe('Chain of Responsibility — AuthHandler', () => {
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    res  = mockRes();
    next = jest.fn();
  });

  test('4.1 missing Authorization header → 401', async () => {
    const req = mockReq({ headers: {} });

    await AuthHandler.handle(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(next).not.toHaveBeenCalled();
  });

  test('4.2 header without "Bearer " prefix → 401', async () => {
    const req = mockReq({ headers: { authorization: 'Token abc123' } });

    await AuthHandler.handle(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('4.3 expired JWT → 401 with "Token expired"', async () => {
    const req = mockReq({ headers: { authorization: 'Bearer expired.token.here' } });

    // Simulate jwt.verify throwing TokenExpiredError
    const expiredError  = new Error('jwt expired');
    expiredError.name   = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => { throw expiredError; });

    await AuthHandler.handle(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Token expired' }));
    expect(next).not.toHaveBeenCalled();
  });

  test('4.4 invalid/tampered JWT → 401 with "Invalid token"', async () => {
    const req = mockReq({ headers: { authorization: 'Bearer tampered.token' } });

    jwt.verify.mockImplementation(() => { throw new Error('invalid signature'); });

    await AuthHandler.handle(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid token' }));
    expect(next).not.toHaveBeenCalled();
  });

  test('4.5 valid token but user not found in DB → 401 "User not found"', async () => {
    const req = mockReq({ headers: { authorization: 'Bearer valid.token.here' } });

    jwt.verify.mockReturnValue({ id: 99 });
    Database.queryOne.mockResolvedValue(undefined); // user does not exist

    await AuthHandler.handle(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'User not found' }));
    expect(next).not.toHaveBeenCalled();
  });

  test('4.6 valid token, user exists but is_active=false → 403 "Account is deactivated"', async () => {
    const req = mockReq({ headers: { authorization: 'Bearer valid.token.here' } });

    jwt.verify.mockReturnValue({ id: 5 });
    Database.queryOne.mockResolvedValue({
      id: 5, username: 'ali', role: 'pharmacist', is_active: false,
    });

    await AuthHandler.handle(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Account is deactivated' }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('4.7 valid token + active user → req.user populated and next() called', async () => {
    const req = mockReq({ headers: { authorization: 'Bearer valid.token.here' } });

    jwt.verify.mockReturnValue({ id: 7 });
    Database.queryOne.mockResolvedValue({
      id: 7, username: 'sara', role: 'admin', is_active: true,
    });

    await AuthHandler.handle(req, res, next);

    // Chain must continue — next() called, no error response
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();

    // req.user must carry id, username, role
    expect(req.user).toEqual({ id: 7, username: 'sara', role: 'admin' });
  });
});

describe('Chain of Responsibility — RoleHandler', () => {
  let res;
  let next;

  beforeEach(() => {
    res  = mockRes();
    next = jest.fn();
  });

  test('4.8 req.user is undefined → 401 (auth step was skipped)', () => {
    const handler = new RoleHandler(['admin']);
    const req     = mockReq({ user: undefined });

    handler.handle(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('4.9 user role not in allowedRoles → 403 "Insufficient permissions"', () => {
    const handler = new RoleHandler(['admin']);
    const req     = mockReq({ user: { id: 1, username: 'bob', role: 'pharmacist' } });

    handler.handle(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Insufficient permissions for this action' }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('4.10 user role IS in allowedRoles → next() called', () => {
    const handler = new RoleHandler(['admin', 'pharmacist']);
    const req     = mockReq({ user: { id: 2, username: 'admin_user', role: 'admin' } });

    handler.handle(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('4.11 multiple allowed roles — user matches one of them → next() called', () => {
    const handler = new RoleHandler(['admin', 'pharmacist', 'manager']);
    const req     = mockReq({ user: { id: 3, username: 'pharm_user', role: 'pharmacist' } });

    handler.handle(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

// VALIDATION HANDLER
describe('Chain of Responsibility — ValidationHandler', () => {
  let res;
  let next;

  beforeEach(() => {
    res  = mockRes();
    next = jest.fn();
  });

  test('4.12 invalid body (missing required fields) → 400 with details', () => {
    const handler = new ValidationHandler(createMedicineSchema);
    
    const req     = mockReq({ body: { quantity: 10, category: 'Painkiller' } });

    handler.handle(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error:   'Validation failed',
        details: expect.any(Object),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('4.13 valid body → req.body replaced with sanitised value and next() called', () => {
    const handler = new ValidationHandler(createMedicineSchema);
    const req     = mockReq({
      body: {
        name:        'Paracetamol',
        quantity:    100,
        expiry_date: '2027-06-01',
        category:    'Analgesic',
        unknown_field: 'should be stripped', 
      },
    });

    handler.handle(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();

    // Unknown field must be stripped by Joi
    expect(req.body).not.toHaveProperty('unknown_field');
    expect(req.body.name).toBe('Paracetamol');
  });

  test('4.14 multiple invalid fields → all appear in details (abortEarly: false)', () => {
    const handler = new ValidationHandler(createMedicineSchema);
    // Both name and quantity are invalid (name too short, quantity negative)
    const req     = mockReq({
      body: { name: 'A', quantity: -5, expiry_date: '2027-01-01', category: 'X' },
    });

    handler.handle(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    const callArg = res.json.mock.calls[0][0];
    
    expect(callArg.details).toHaveProperty('name');
    expect(callArg.details).toHaveProperty('quantity');
    expect(next).not.toHaveBeenCalled();
  });
});
