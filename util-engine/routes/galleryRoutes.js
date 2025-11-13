// routes/galleryRoutes.js
const express = require('express');
const { supabasePublic } = require('../config/supabaseClient');
const { getEmbedding } = require('../services/aiService'); // 1. Import getEmbedding
const router = express.Router();

// GET /api/gallery
// This route now handles BOTH all tools AND search
router.get('/', async (req, res) => {
  try {
    const searchQuery = req.query.q; // 2. Check for a search query (e.g., /api/gallery?q=word)

    if (searchQuery) {
      // --- 3. If a search query exists, run vector search ---
      console.log(`[Gallery] Running vector search for: "${searchQuery}"`);
      const query_embedding = await getEmbedding(searchQuery);

      const { data, error } = await supabasePublic.rpc('search_tools', {
        query_embedding,
        match_threshold: 0.3, // Adjust this "relevance" score as needed
        result_limit: 20
      });

      if (error) throw error;
      res.json(data);

    } else {
      // --- 4. If no query, return all published tools as before ---
      const { data, error } = await supabasePublic
        .from('community_tools')
        .select('id, name, description, category')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    }
  } catch (error) {
    console.error('Error fetching gallery:', error.message);
    res.status(500).json({ error: 'Failed to fetch tools.' });
  }
});

// --- (NEW!) ---
// GET /api/gallery/:id
// Gets a single, published tool by its ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Our RLS policy (status = 'published') is applied automatically!
    const { data, error } = await supabasePublic
      .from('community_tools')
      .select('name, description, category, generated_html')
      .eq('id', id)
      .single(); // .single() is key: it gets one row or returns an error

    if (error) {
      // This will fire if the tool isn't found or isn't published
      return res.status(404).json({ error: 'Tool not found or not published.' });
    }
    
    res.json(data);

  } catch (error) {
    console.error('Error fetching single tool:', error.message);
    res.status(500).json({ error: 'Failed to fetch tool.' });
  }
});
module.exports = router;