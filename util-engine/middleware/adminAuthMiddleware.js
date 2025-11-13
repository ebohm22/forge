// middleware/adminAuthMiddleware.js
const { supabase } = require('../config/supabaseClient'); // Import the client

const adminAuthMiddleware = async (req, res, next) => {
  // 1. Get the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization token provided.' });
  }

  // 2. Get the token
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Malformed token.' });
  }

  try {
    // 3. Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    // 4. (THE CRITICAL CHECK) Verify if they are an admin
    if (user.user_metadata?.isAdmin !== true) {
      return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }

    // 5. Success! Attach the user and proceed.
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication error.' });
  }
};

module.exports = adminAuthMiddleware;