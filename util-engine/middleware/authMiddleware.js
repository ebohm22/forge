// middleware/authMiddleware.js
const { supabase } = require('../config/supabaseClient'); // Import the client

const authMiddleware = async (req, res, next) => {
  // 1. Get the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization token provided.' });
  }

  // 2. Get the token (it's in the format "Bearer <token>")
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

    // 4. Success! Attach the user to the request object
    req.user = user;
    next(); // Continue to the actual API endpoint
  } catch (error) {
    res.status(500).json({ error: 'Authentication error.' });
  }
};

module.exports = authMiddleware;