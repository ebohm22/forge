// src/middleware/authMiddleware.js
import { createMiddleware } from 'hono/factory';
import { getSupabaseClient } from '../config/supabaseClient';

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
    const supabase = getSupabaseClient(c);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return c.json({ error: 'Invalid token.' }, 401);
    }

    c.set('user', user); // Pass the user to the next handler
    await next();
  } catch (error) {
    return c.json({ error: 'Authentication error.' }, 500);
  }
});

// Create a separate admin middleware
export const adminAuthMiddleware = createMiddleware(async (c, next) => {
  const user = c.get('user'); // Assumes authMiddleware ran first

  if (user?.user_metadata?.isAdmin !== true) {
    return c.json({ error: 'Forbidden: Admin access required.' }, 403);
  }

  await next();
});