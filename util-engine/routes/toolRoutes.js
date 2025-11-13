// routes/toolRoutes.js
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { runGuardrail, findMatchingTool, runBrain, runImageBrain, runDataBrain, runWorkflowBrain,runMetadataBrain } = require('../services/aiService');
const { supabase } = require('../config/supabaseClient');
const router = express.Router();

// routes/toolRoutes.js

// POST /api/tools/generate
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { userPrompt } = req.body;

    if (!userPrompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    // 1. Run the Guardrail
    const classification = await runGuardrail(userPrompt);

    // 2. Reject
    if (classification === 'REJECTED') {
      return res.status(400).json({
        error: "Sorry, I am unable to build that type of tool.",
      });
    }

    // 3. Smart Check
    // We run this first. If a user asks for a simple workflow that
    // *matches* a published tool, the vector search will find it.
    const matchedHtml = await findMatchingTool(userPrompt);
    if (matchedHtml) {
      return res.json({ html: matchedHtml, fromCache: true });
    }

    // 4. (UPDATED) Route to the correct "Brain"
    let htmlCode;
    if (classification === 'TEXT_TOOL') {
      console.log("[Main] Classification: TEXT. Proceeding to text code generation.");
      htmlCode = await runBrain(userPrompt);
    } else if (classification === 'IMAGE_TOOL') {
      console.log("[Main] Classification: IMAGE. Proceeding to image code generation.");
      htmlCode = await runImageBrain(userPrompt);
    } else if (classification === 'DATA_TOOL') {
      console.log("[Main] Classification: DATA. Proceeding to data code generation.");
      htmlCode = await runDataBrain(userPrompt);
    } else if (classification === 'WORKFLOW') { // 2. Add the new route
      console.log("[Main] Classification: WORKFLOW. Proceeding to workflow generation.");
      htmlCode = await runWorkflowBrain(userPrompt);
    } else {
      console.error(`[Main] Unknown classification: ${classification}`);
      return res.status(500).json({ error: 'An unknown error occurred.' });
    }
    
    // 5. Send the result
    res.json({ 
      html: htmlCode, 
      fromCache: false, 
      classification: classification // <-- RETURN THE CLASSIFICATION
    });

  } catch (error) {
    console.error('Error in /api/generate:', error);
    res.status(500).json({ error: 'Failed to generate tool.' });
  }
});
// POST /api/tools/suggest-metadata
router.post('/suggest-metadata', authMiddleware, async (req, res) => {
  try {
    const { userPrompt, toolType } = req.body;
    if (!userPrompt || !toolType) {
      return res.status(400).json({ error: 'Prompt and toolType are required.' });
    }

    const metadata = await runMetadataBrain(userPrompt, toolType);
    res.json(metadata);

  } catch (error) {
    console.error('Error suggesting metadata:', error);
    res.status(500).json({ error: 'Failed to suggest metadata.' });
  }
});

// ... (your /submit route)
module.exports = router;
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { name, description, category, original_prompt, generated_html } = req.body;
    
    // We don't need to pass user_id!
    // The database policy (DEFAULT auth.uid()) and the fact that
    // we're making an authenticated request handles it automatically.
    
    // We use the admin client to bypass RLS for *writing*
    const { error } = await supabase
      .from('community_tools')
      .insert([
        { 
          user_id: req.user.id, // We get the user ID from our middleware
          name, 
          description, 
          category, 
          original_prompt, 
          generated_html 
        }
      ]);

    if (error) throw error;
    res.json({ message: 'Tool submitted for review!' });

  } catch (error) {
    console.error('Error submitting tool:', error.message);
    res.status(500).json({ error: 'Failed to submit tool.' });
  }
});

module.exports = router;