/**
 * User Profile API Endpoint
 * GET /api/v1/user/profile
 * 
 * Returns the authenticated user's profile including:
 * - User ID, email, display name
 * - Role (site_admin, coordinator, investigator, etc.)
 * - Client ID (for multi-tenancy data filtering)
 * - Client information (site name, organization type)
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

// This would be imported from your database config
// import { pool } from '../config/database';

interface UserProfile {
  id: string;
  azureAdUserId: string;
  email: string;
  displayName: string;
  role: 'site_admin' | 'coordinator' | 'investigator' | 'monitor' | 'viewer';
  clientId: string;
  client: {
    name: string;
    organizationType: string;
  };
  lastLogin: string;
}

/**
 * GET /api/v1/user/profile
 * Retrieves the current user's profile based on Azure AD authentication
 */
export async function getUserProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract Azure AD User ID from authenticated token
    // This comes from the JWT token validated by middleware
    const azureAdUserId = req.user?.oid || req.user?.sub; // 'oid' is the Object ID from Azure AD
    
    if (!azureAdUserId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No Azure AD user ID found in token'
      });
      return;
    }

    // Query database for user profile
    const pool: Pool = req.app.locals.pool; // Assuming pool is attached to app.locals
    
    const query = `
      SELECT 
        u.id,
        u.azure_ad_user_id AS "azureAdUserId",
        u.email,
        u.display_name AS "displayName",
        u.role,
        u.last_login AS "lastLogin",
        u.client_id AS "clientId",
        c.name AS "clientName",
        c.organization_type AS "organizationType"
      FROM users u
      INNER JOIN clients c ON u.client_id = c.id
      WHERE u.azure_ad_user_id = $1 
        AND u.active = true 
        AND c.active = true
    `;

    const result = await pool.query(query, [azureAdUserId]);

    if (result.rows.length === 0) {
      // User not found in database - this is their first login
      res.status(404).json({
        error: 'User not found',
        message: 'User profile not found. Please contact your administrator to set up your account.',
        azureAdUserId: azureAdUserId
      });
      return;
    }

    const userData = result.rows[0];

    // Update last login timestamp
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userData.id]
    );

    // Construct user profile response
    const userProfile: UserProfile = {
      id: userData.id,
      azureAdUserId: userData.azureAdUserId,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      clientId: userData.clientId,
      client: {
        name: userData.clientName,
        organizationType: userData.organizationType
      },
      lastLogin: userData.lastLogin
    };

    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve user profile'
    });
  }
}

/**
 * POST /api/v1/user/profile/register
 * Auto-register a new user on first Azure AD login
 * (Optional - for automatic user provisioning)
 */
export async function registerNewUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { azureAdUserId, email, displayName, clientId, role } = req.body;

    if (!azureAdUserId || !email || !clientId || !role) {
      res.status(400).json({
        error: 'Bad request',
        message: 'Missing required fields: azureAdUserId, email, clientId, role'
      });
      return;
    }

    const pool: Pool = req.app.locals.pool;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE azure_ad_user_id = $1',
      [azureAdUserId]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({
        error: 'Conflict',
        message: 'User already exists'
      });
      return;
    }

    // Insert new user
    const insertQuery = `
      INSERT INTO users (azure_ad_user_id, email, display_name, client_id, role, active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id, azure_ad_user_id AS "azureAdUserId", email, display_name AS "displayName", role, client_id AS "clientId"
    `;

    const result = await pool.query(insertQuery, [
      azureAdUserId,
      email,
      displayName,
      clientId,
      role
    ]);

    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error registering new user:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register user'
    });
  }
}
