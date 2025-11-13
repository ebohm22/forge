// src/middleware/authMiddleware.js
import { createMiddleware } from 'hono/factory';
import { getSupabaseClient } from '../config/supabaseClient.js'; // Use .js extension

// This is the base authentication middleware
export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'No authorization token provided.' }, 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return c.json({ error: 'Malformed token.' }, 401);
  }

  try {
    const supabase = getSupabaseClient(c); // Correctly get client from context
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return c.json({ error: 'Invalid token.' }, 401);
    }

    // Set the user in the context for the next handlers
    c.set('user', user);
    await next();

  } catch (error) {
    return c.json({ error: 'Authentication error.' }, 500);
  }
});

// This is the admin-specific middleware
export const adminAuthMiddleware = createMiddleware(async (c, next) => {
  // This middleware *must* run AFTER authMiddleware
  const user = c.get('user');

  if (user?.user_metadata?.isAdmin !== true) {
    return c.json({ error: 'Forbidden: Admin access required.' }, 403);
  }
  
  // User is authenticated AND is an admin
  await next();
});