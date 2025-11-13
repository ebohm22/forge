// routes/myToolsRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { supabase } = require('../config/supabaseClient');

// GET /api/my-tools
// Gets all saved tools for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    // This query joins the user_saved_tools with community_tools
    // to get the full tool details.
    const { data, error } = await supabase
      .from('user_saved_tools')
      .select(`
        tool_id,
        community_tools (
          id,
          name,
          description,
          category
        )
      `)
      .eq('user_id', req.user.id);

    if (error) throw error;

    // Reshape the data to be a simple array of tools
    const tools = data.map(item => item.community_tools);
    res.json(tools);

  } catch (error) {
    console.error('Error fetching saved tools:', error.message);
    res.status(500).json({ error: 'Failed to fetch saved tools.' });
  }
});

// POST /api/my-tools/:toolId/save
// Saves a tool to the user's list
router.post('/:toolId/save', authMiddleware, async (req, res) => {
  try {
    const { toolId } = req.params;
    const { error } = await supabase
      .from('user_saved_tools')
      .insert({
        user_id: req.user.id,
        tool_id: toolId
      });
    
    // Handle "duplicate" error gracefully
    if (error && error.code === '23505') {
      return res.status(200).json({ message: 'Tool already saved.' });
    }
    if (error) throw error;

    res.status(201).json({ message: 'Tool saved!' });
  } catch (error) {
    console.error('Error saving tool:', error.message);
    res.status(500).json({ error: 'Failed to save tool.' });
  }
});

// (Optional, but good to have)
// DELETE /api/my-tools/:toolId/unsave
router.delete('/:toolId/unsave', authMiddleware, async (req, res) => {
  try {
    const { toolId } = req.params;
    const { error } = await supabase
      .from('user_saved_tools')
      .delete()
      .eq('user_id', req.user.id)
      .eq('tool_id', toolId);

    if (error) throw error;
    res.json({ message: 'Tool unsaved.' });
  } catch (error) {
    console.error('Error unsaving tool:', error.message);
    res.status(500).json({ error: 'Failed to unsave tool.' });
  }
});


module.exports = router;