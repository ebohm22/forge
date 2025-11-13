// routes/adminRoutes.js
const express = require('express');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');
const { supabase } = require('../config/supabaseClient');
const { getEmbedding } = require('../services/aiService');
const router = express.Router();

// GET /api/admin/pending
router.get('/pending', adminAuthMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('community_tools')
      .select('*') // Select all data for review
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching pending tools:', error.message);
    res.status(500).json({ error: 'Failed to fetch pending tools.' });
  }
});

// 2. Endpoint to routerROVE or REJECT a tool
// PUT /api/admin/review/:id
router.put('/review/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus } = req.body;
    
    let updateData = { status: newStatus };

    // (NEW!) If we are publishing this tool...
    if (newStatus === 'published') {
      // First, get the tool's text
      const { data: toolData, error: fetchError } = await supabase
        .from('community_tools')
        .select('name, description')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;

      // Create a text blob to embed
      const textToEmbed = `Name: ${toolData.name}\nDescription: ${toolData.description}`;
      
      // Generate the embedding
      const embedding = await getEmbedding(textToEmbed);
      updateData.embedding = embedding; // Add the embedding to our update
    }

    const { data, error } = await supabase
      .from('community_tools')
      .update(updateData) // Save the new status AND embedding
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating tool status:', error.message);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

module.exports = router;