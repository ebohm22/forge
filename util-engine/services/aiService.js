// services/aiService.js
const { openai } = require('../config/openaiClient');
const { supabasePublic } = require('../config/supabaseClient');
const { supabase } = require('../config/supabaseClient');7

// --- (NEW) Import all prompts ---
const GUARDRAIL_SYSTEM_PROMPT = require('../prompts/guardrailPrompt');
const BRAIN_SYSTEM_PROMPT = require('../prompts/textBrainPrompt');
const IMAGE_BRAIN_PROMPT = require('../prompts/imageBrainPrompt');
const DATA_BRAIN_PROMPT = require('../prompts/dataBrainPrompt');
const WORKFLOW_BRAIN_PROMPT = require('../prompts/workflowBrainPrompt');
const METADATA_BRAIN_PROMPT = require('../prompts/metadataBrainPrompt');
/**
 * (NEW!) Generates a vector embedding for a given text.
 * @param {string} text - The text to embed.
 * @returns {Promise<number[]>} - The 1536-dimension vector.
 */
async function getEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error getting embedding:', error.message);
    throw new Error('Failed to generate embedding.');
  }
}

/**
 * Runs the cheap/fast classifier.
 * @param {string} userPrompt - The user's raw input.
 * @returns {Promise<"TEXT_TOOL" | "IMAGE_TOOL" | "REJECTED">} - The classification.
 */
async function runGuardrail(userPrompt) {
  console.log(`[Guardrail] Classifying prompt: "${userPrompt}"`);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: GUARDRAIL_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0,
    });

    const classification = completion.choices[0].message.content.trim();
    console.log(`[Guardrail] Classification: ${classification}`);

    // (UPDATED) Add "WORKFLOW" to the valid list
    if (
      classification === "TEXT_TOOL" ||
      classification === "IMAGE_TOOL" ||
      classification === "DATA_TOOL" ||
      classification === "WORKFLOW" || // <-- New
      classification === "REJECTED"
    ) {
      return classification;
    } else {
      console.warn(`[Guardrail] Received unexpected classification: "${classification}". Defaulting to REJECTED.`);
      return "REJECTED";
    }

  } catch (error) {
    console.error("[Guardrail] Error calling OpenAI API:", error);
    return "REJECTED";
  }
}
/**
 * (NEW!) This function runs the expensive/smart code generator.
 * @param {string} userPrompt - The user's raw input.
 * @returns {Promise<string>} - The generated HTML code.
 */
async function runBrain(userPrompt) {
  console.log(`[Brain] Generating code for prompt: "${userPrompt}"...`);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: BRAIN_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    let htmlCode = completion.choices[0].message.content;

    // Remove the starting "```html\n" or "```\n"
    htmlCode = htmlCode.replace(/^```(html)?\s*\n/, ''); 
    // Remove the ending "\n```"
    htmlCode = htmlCode.replace(/\s*\n```$/, '');

    return htmlCode;

  } catch (error) {
    console.error("[Brain] Error calling OpenAI API:", error);
    return "<!DOCTYPE html><html><body><h1>Error generating tool.</h1></body></html>";
  }
}

/**
 * (NEW!) Runs the AI "Brain" for image generation.
 * @param {string} userPrompt - The user's raw input.
 * @returns {Promise<string>} - The generated HTML code.
 */
async function runImageBrain(userPrompt) {
  console.log(`[ImageBrain] Generating code for prompt: "${userPrompt}"...`);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Use the powerful model for this complex task
      messages: [
        {
          role: "system",
          content: IMAGE_BRAIN_PROMPT, // Use the new image prompt
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    let htmlCode = completion.choices[0].message.content;
    htmlCode = htmlCode.replace(/^```(html)?\s*\n/, '');
    htmlCode = htmlCode.replace(/\s*\n```$/, '');

    return htmlCode;

  } catch (error) {
    console.error("Error in runImageBrain:", error.message);
    throw new Error('Failed to generate image tool code.');
  }
}

// services/aiService.js

// ... (your existing runBrain and runImageBrain functions) ...

/**
 * (NEW!) Runs the AI "Brain" for data tool generation.
 * @param {string} userPrompt - The user's raw input.
 * @returns {Promise<string>} - The generated HTML code.
 */
async function runDataBrain(userPrompt) {
  console.log(`[DataBrain] Generating code for prompt: "${userPrompt}"...`);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Use the powerful model
      messages: [
        {
          role: "system",
          content: DATA_BRAIN_PROMPT, // Use the new data prompt
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    let htmlCode = completion.choices[0].message.content;
    htmlCode = htmlCode.replace(/^```(html)?\s*\n/, '');
    htmlCode = htmlCode.replace(/\s*\n```$/, '');

    return htmlCode;

  } catch (error) {
    console.error("Error in runDataBrain:", error.message);
    throw new Error('Failed to generate data tool code.');
  }
}

/**
 * (NEW!) Runs the AI "Brain" for workflow generation.
 * @param {string} userPrompt - The user's raw input.
 * @returns {Promise<string>} - The generated HTML code.
 */
async function runWorkflowBrain(userPrompt) {
  console.log(`[WorkflowBrain] Generating code for prompt: "${userPrompt}"...`);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Must use the most powerful model
      messages: [
        {
          role: "system",
          content: WORKFLOW_BRAIN_PROMPT, // Use the new workflow prompt
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    let htmlCode = completion.choices[0].message.content;
    htmlCode = htmlCode.replace(/^```(html)?\s*\n/, '');
    htmlCode = htmlCode.replace(/\s*\n```$/, '');

    return htmlCode;

  } catch (error) {
    console.error("Error in runWorkflowBrain:", error.message);
    throw new Error('Failed to generate workflow code.');
  }
}

// services/aiService.js
// ... (other brain functions)

/**
 * (NEW!) Generates suggested metadata for a tool.
 * @param {string} userPrompt - The user's raw input.
 * @param {string} toolType - The classification (e.g., TEXT_TOOL).
 * @returns {Promise<object>} - An object { name, description, category }.
 */
async function runMetadataBrain(userPrompt, toolType) {
  console.log(`[MetadataBrain] Generating metadata for: "${userPrompt}"`);
  
  let filledPrompt = METADATA_BRAIN_PROMPT
    .replace('{USER_PROMPT}', userPrompt)
    .replace('{TOOL_TYPE}', toolType);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Fast and cheap is perfect
      messages: [
        // The prompt is pre-filled, so we just use a system message
        { role: "system", content: filledPrompt },
      ],
      temperature: 0.2,
    });

    const responseText = completion.choices[0].message.content;
    
    // --- (NEW!) ADD THIS BLOCK TO CLEAN THE AI RESPONSE ---
    // Find the first '{' and the last '}'
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("AI did not return valid JSON.");
    }
    const jsonString = responseText.substring(jsonStart, jsonEnd + 1);
    // --- END OF NEW BLOCK ---
    return JSON.parse(jsonString);
    
  } catch (error) {
    console.error("Error in runMetadataBrain:", error.message);
    throw new Error('Failed to generate metadata.');
  }
}

/**
 * (REPLACED!) Uses vector search to find a matching tool.
 * @param {string} userPrompt - The user's raw input.
 * @returns {Promise<string|null>} - The HTML of the matching tool, or null.
 */
async function findMatchingTool(userPrompt) {
  console.log(`[SmartCheck] Running vector search for: "${userPrompt}"`);
  
  try {
    // 1. Get the embedding for the user's prompt
    const query_embedding = await getEmbedding(userPrompt);

    // 2. Call our custom database function
    const { data, error } = await supabase.rpc('match_tool', {
      query_embedding,
      match_threshold: 0.67, // This is a "confidence" score. Tune as needed.
      match_count: 1
    });

    if (error) throw error;

    // 3. Check if we have a good match
    if (data && data.length > 0) {
      console.log(`[SmartCheck] Vector match found! Serving tool: "${data[0].name}"`);
      return data[0].generated_html;
    }

    console.log('[SmartCheck] No vector match found.');
    return null;

  } catch (error) {
    console.error('[SmartCheck] Vector search failed:', error.message);
    return null; // Fail silently, proceed to generate
  }
}

// services/aiService.js
module.exports = {
  runGuardrail,
  runBrain,
  runWorkflowBrain, // <-- Add this
  runImageBrain, // <-- Add this
  runDataBrain, // <-- Add this
  findMatchingTool,
  runMetadataBrain,
  getEmbedding
};