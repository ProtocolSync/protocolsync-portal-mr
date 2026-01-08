/**
 * Azure AD JWT Authentication Middleware
 * 
 * Validates JWT tokens from Azure Entra ID and extracts user information
 * Attach to protected routes to ensure authentication
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Azure AD configuration
const AZURE_AD_TENANT_ID = process.env.AZURE_AD_TENANT_ID || 'YOUR_TENANT_ID';
const AZURE_AD_CLIENT_ID = process.env.AZURE_AD_CLIENT_ID || 'YOUR_CLIENT_ID';

// JWKS client to fetch Azure AD public keys
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/discovery/v2.0/keys`
});

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        oid: string;  // Azure AD Object ID
        sub: string;  // Subject
        email: string;
        name: string;
        preferred_username: string;
        roles?: string[];
      };
    }
  }
}

/**
 * Get signing key from Azure AD JWKS
 */
function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Middleware: Validate Azure AD JWT token
 */
export function validateAzureADToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization token provided'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    jwt.verify(
      token,
      getKey,
      {
        audience: AZURE_AD_CLIENT_ID, // Client ID of your app
        issuer: `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/v2.0`,
        algorithms: ['RS256']
      },
      (err, decoded) => {
        if (err) {
          console.error('JWT verification failed:', err);
          res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token'
          });
          return;
        }

        // Attach user information to request
        req.user = decoded as any;
        next();
      }
    );
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
}

/**
 * Middleware: Require specific role
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.user?.roles?.[0]; // Assuming single role

    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
}

/**
 * Example usage in Express routes:
 * 
 * import { validateAzureADToken, requireRole } from './middleware/auth';
 * 
 * // Protected route - requires authentication
 * app.get('/api/v1/user/profile', validateAzureADToken, getUserProfile);
 * 
 * // Protected route - requires specific role
 * app.put('/api/v1/document/:id/status', 
 *   validateAzureADToken, 
 *   requireRole('site_admin', 'coordinator'),
 *   updateDocumentStatus
 * );
 */
