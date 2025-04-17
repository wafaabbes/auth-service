const jwt = require('jsonwebtoken');
const { verifyToken, checkRole } = require('../../middleware/authMiddleware'); // Chemin corrigé
const { mockRequest, mockResponse } = require('../helpers/mocks');

// Configuration des tokens de test
process.env.JWT_SECRET = 'test-secret';
const validToken = jwt.sign({ userId: 123, role: 'admin' }, process.env.JWT_SECRET);
const expiredToken = jwt.sign({ userId: 123 }, process.env.JWT_SECRET, { expiresIn: '-1s' });
const invalidToken = 'invalid.token.here';

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('verifyToken()', () => {
    it('should allow access with valid token', () => {
      req = mockRequest({ 
        headers: { 
          authorization: `Bearer ${validToken}` 
        } 
      });
      
      verifyToken(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({
        userId: 123,
        role: 'admin',
        iat: expect.any(Number)
      });
    });

    it('should reject requests without token', () => {
      verifyToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Token d\'authentification requis' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token format', () => {
      req = mockRequest({ 
        headers: { 
          authorization: 'InvalidFormat' 
        } 
      });
      
      verifyToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject expired token', () => {
      req = mockRequest({ 
        headers: { 
          authorization: `Bearer ${expiredToken}` 
        } 
      });
      
      verifyToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Token invalide' 
      });
    });

    it('should reject invalid token', () => {
      req = mockRequest({ 
        headers: { 
          authorization: `Bearer ${invalidToken}` 
        } 
      });
      
      verifyToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Token invalide' 
      });
    });
  });

  describe('checkRole()', () => {
    it('should allow access for authorized roles', () => {
      req = mockRequest({ 
        user: { 
          role: 'admin' 
        } 
      });
      
      checkRole(['admin'])(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject unauthorized roles', () => {
      req = mockRequest({ 
        user: { 
          role: 'user' 
        } 
      });
      
      checkRole(['admin'])(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Permissions insuffisantes' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle missing user role', () => {
      req = mockRequest({ user: null });
      
      checkRole(['admin'])(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Accès refusé' 
      });
    });

    it('should work with multiple allowed roles', () => {
      req = mockRequest({ 
        user: { 
          role: 'editor' 
        } 
      });
      
      checkRole(['admin', 'editor'])(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });
});