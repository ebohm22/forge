// src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
// 1. Import middleware with .js extension
import { authMiddleware, adminAuthMiddleware } from './middleware/authMiddleware.js' 
// 2. Fix import path and add .js extension
import { getSupabaseClient, getSupabasePublicClient } from './config/supabaseClient.js' 
// 3. Import services with .js extension
import {
  runGuardrail,
  findMatchingTool,
  runBrain,
  runImageBrain,
  runDataBrain,
  runWorkflowBrain,
  runMetadataBrain,
  getEmbedding
} from './services/aiService.js'

// 4. Fix Binding names
export type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_ANON_KEY: string;
  OPENAI_API_KEY: string;
}

const app = new Hono<{ Bindings: Bindings }>()
app.use('*', cors())

const api = new Hono<{ Bindings: Bindings }>()

// === Public Gallery Routes ===
api.get('/gallery', async (c) => {
  // 5. Fix variable names
  const supabasePublic = getSupabasePublicClient(c); 
  const searchQuery = c.req.query('q');
  try {
    if (searchQuery) {
      console.log(`[Gallery] Running vector search for: "${searchQuery}"`);
      const query_embedding = await getEmbedding(c, searchQuery);
      const { data, error } = await supabasePublic.rpc('search_tools', {
        query_embedding,
        match_threshold: 0.4,
        result_limit: 20
      });
      if (error) throw error;
      return c.json(data);
    } else {
      const { data, error } = await supabasePublic
        .from('community_tools')
        .select('id, name, description, category')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return c.json(data);
    }
  } catch (error: any) {
    console.error('Error fetching gallery:', error.message);
    return c.json({ error: 'Failed to fetch tools.' }, 500);
  }
});

api.get('/gallery/:id', async (c) => {
  const supabasePublic = getSupabasePublicClient(c); // Fix variable name
  const id = c.req.param('id');
  try {
    const { data, error } = await supabasePublic
      .from('community_tools')
      .select('name, description, category, generated_html')
      .eq('id', id)
      .single();
    if (error) {
      return c.json({ error: 'Tool not found or not published.' }, 404);
    }
    return c.json(data);
  } catch (error: any) {
    console.error('Error fetching single tool:', error.message);
    return c.json({ error: 'Failed to fetch tool.' }, 500);
  }
});

// === User-Protected Tool Routes ===
api.use('/tools/*', authMiddleware);
api.post('/tools/generate', async (c) => {
  try {
    const { userPrompt } = await c.req.json();
    if (!userPrompt) return c.json({ error: 'Prompt is required.' }, 400);

    const classification = await runGuardrail(c, userPrompt);
    if (classification === 'REJECTED') {
      return c.json({ error: "Sorry, I am unable to build that type of tool." }, 400);
    }

    const matchedHtml = await findMatchingTool(c, userPrompt);
    if (matchedHtml) {
      return c.json({ html: matchedHtml, fromCache: true });
    }

    let htmlCode;
    if (classification === 'TEXT_TOOL') htmlCode = await runBrain(c, userPrompt);
    else if (classification === 'IMAGE_TOOL') htmlCode = await runImageBrain(c, userPrompt);
    else if (classification === 'DATA_TOOL') htmlCode = await runDataBrain(c, userPrompt);
    else if (classification === 'WORKFLOW') htmlCode = await runWorkflowBrain(c, userPrompt);
    else return c.json({ error: 'An unknown error occurred.' }, 500);

    return c.json({ html: htmlCode, fromCache: false, classification: classification });
  } catch (error: any) {
    console.error('Error in /api/generate:', error.message);
    return c.json({ error: 'Failed to generate tool.' }, 500);
  }
});

api.post('/tools/suggest-metadata', async (c) => {
  try {
    const { userPrompt, toolType } = await c.req.json();
    if (!userPrompt || !toolType) {
      return c.json({ error: 'Prompt and toolType are required.' }, 400);
    }
    const metadata = await runMetadataBrain(c, userPrompt, toolType);
    return c.json(metadata);
  } catch (error: any) {
    console.error('Error suggesting metadata:', error.message);
    return c.json({ error: 'Failed to suggest metadata.' }, 500);
  }
});

api.post('/tools/submit', async (c) => {
  const supabase = getSupabaseClient(c); // Fix variable name
  const user = c.get('user');
  try {
    const { name, description, category, original_prompt, generated_html } = await c.req.json();
    const { error } = await supabase.from('community_tools').insert([
      { user_id: user.id, name, description, category, original_prompt, generated_html }
    ]);
    if (error) throw error;
    return c.json({ message: 'Tool submitted for review!' });
  } catch (error: any) {
    console.error('Error submitting tool:', error.message);
    return c.json({ error: 'Failed to submit tool.' }, 500);
  }
});

// === User-Protected "My Tools" Routes ===
api.use('/my-tools/*', authMiddleware);
api.get('/my-tools', async (c) => {
  const supabase = getSupabaseClient(c); // Fix variable name
  const user = c.get('user');
  try {
    const { data, error } = await supabase
      .from('user_saved_tools')
      .select('community_tools ( id, name, description, category )')
      .eq('user_id', user.id);
    if (error) throw error;
    const tools = data.map((item: any) => item.community_tools);
    return c.json(tools);
  } catch (error: any) {
    console.error('Error fetching saved tools:', error.message);
    return c.json({ error: 'Failed to fetch saved tools.' }, 500);
  }
});

api.post('/my-tools/:toolId/save', async (c) => {
  const supabase = getSupabaseClient(c); // Fix variable name
  const user = c.get('user');
  const toolId = c.req.param('toolId');
  try {
    const { error } = await supabase.from('user_saved_tools').insert({
      user_id: user.id,
      tool_id: toolId
    });
    if (error && error.code === '23505') {
      return c.json({ message: 'Tool already saved.' }, 200);
    }
    if (error) throw error;
    return c.json({ message: 'Tool saved!' }, 201);
  } catch (error: any) {
    console.error('Error saving tool:', error.message);
    return c.json({ error: 'Failed to save tool.' }, 500);
  }
});

api.delete('/my-tools/:toolId/unsave', async (c) => {
  const supabase = getSupabaseClient(c); // Fix variable name
  const user = c.get('user');
  const toolId = c.req.param('toolId');
  try {
    const { error } = await supabase
      .from('user_saved_tools')
      .delete()
      .eq('user_id', user.id)
      .eq('tool_id', toolId);
    if (error) throw error;
    return c.json({ message: 'Tool unsaved.' });
  } catch (error: any) {
    console.error('Error unsaving tool:', error.message);
    return c.json({ error: 'Failed to unsave tool.' }, 500);
  }
});


// === Admin-Protected Routes ===
const adminApi = new Hono<{ Bindings: Bindings }>();
adminApi.use('*', authMiddleware, adminAuthMiddleware);

adminApi.get('/pending', async (c) => {
  const supabase = getSupabaseClient(c); // Fix variable name
  try {
    const { data, error } = await supabase
      .from('community_tools')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return c.json(data);
  } catch (error: any) {
    console.error('Error fetching pending tools:', error.message);
    return c.json({ error: 'Failed to fetch pending tools.' }, 500);
  }
});

adminApi.put('/review/:id', async (c) => {
  const supabase = getSupabaseClient(c); // Fix variable name
  const id = c.req.param('id');
  const { newStatus } = await c.req.json();
  let updateData: any = { status: newStatus };

  try {
    if (newStatus === 'published') {
      const { data: toolData, error: fetchError } = await supabase
        .from('community_tools')
        .select('name, description')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;
      
      const textToEmbed = `Name: ${toolData.name}\nDescription: ${toolData.description}`;
      const embedding = await getEmbedding(c, textToEmbed);
      updateData.embedding = embedding;
    }

    const { data, error } = await supabase
      .from('community_tools')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return c.json(data);
  } catch (error: any) {
    console.error('Error updating tool status:', error.message);
    return c.json({ error: 'Failed to update status.' }, 500);
  }
});

// --- Mount all routes ---
app.route('/api', api);
app.route('/api/admin', adminApi);

export default app;