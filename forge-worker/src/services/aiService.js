// src/services/aiService.js
import { getOpenAIClient } from '../config/openaiClient.js';
import { getSupabaseClient, getSupabasePublicClient } from '../config/supabaseClient.js';

import GUARDRAIL_SYSTEM_PROMPT from '../prompts/guardrailPrompt.js';
import BRAIN_SYSTEM_PROMPT from '../prompts/textBrainPrompt.js';
import IMAGE_BRAIN_PROMPT from '../prompts/imageBrainPrompt.js';
import DATA_BRAIN_PROMPT from '../prompts/dataBrainPrompt.js';
import WORKFLOW_BRAIN_PROMPT from '../prompts/workflowBrainPrompt.js';
import METADATA_BRAIN_PROMPT from '../prompts/metadataBrainPrompt.js';

export async function getEmbedding(c, text) {
  const openai = getOpenAIClient(c);
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

export async function runGuardrail(c, userPrompt) {
  const openai = getOpenAIClient(c);
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
    if (
      classification === "TEXT_TOOL" ||
      classification === "IMAGE_TOOL" ||
      classification === "DATA_TOOL" ||
      classification === "WORKFLOW" ||
      classification === "REJECTED"
    ) {
      return classification;
    } else {
      console.warn(`[Guardrail] Received unexpected classification: "${classification}". Defaulting to REJECTED.`);
      return "REJECTED";
    }
  } catch (error) {
    console.error("[Guardrail] Error calling OpenAI API:", error.message);
    return "REJECTED";
  }
}

export async function runBrain(c, userPrompt) {
  const openai = getOpenAIClient(c);
  console.log(`[Brain] Generating code for prompt: "${userPrompt}"...`);
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: BRAIN_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });
    let htmlCode = completion.choices[0].message.content;
    htmlCode = htmlCode.replace(/^```(html)?\s*\n/, ''); 
    htmlCode = htmlCode.replace(/\s*\n```$/, '');
    return htmlCode;
  } catch (error) {
    console.error("[Brain] Error calling OpenAI API:", error.message);
    return "<!DOCTYPE html><html><body><h1>Error generating tool.</h1></body></html>";
  }
}

export async function runImageBrain(c, userPrompt) {
  const openai = getOpenAIClient(c);
  console.log(`[ImageBrain] Generating code for prompt: "${userPrompt}"...`);
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: IMAGE_BRAIN_PROMPT },
        { role: "user", content: userPrompt },
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

export async function runDataBrain(c, userPrompt) {
  const openai = getOpenAIClient(c);
  console.log(`[DataBrain] Generating code for prompt: "${userPrompt}"...`);
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: DATA_BRAIN_PROMPT },
        { role: "user", content: userPrompt },
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

export async function runWorkflowBrain(c, userPrompt) {
  const openai = getOpenAIClient(c);
  console.log(`[WorkflowBrain] Generating code for prompt: "${userPrompt}"...`);
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: WORKFLOW_BRAIN_PROMPT },
        { role: "user", content: userPrompt },
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

export async function runMetadataBrain(c, userPrompt, toolType) {
  const openai = getOpenAIClient(c);
  console.log(`[MetadataBrain] Generating metadata for: "${userPrompt}"`);
  
  let filledPrompt = METADATA_BRAIN_PROMPT
    .replace('{USER_PROMPT}', userPrompt)
    .replace('{TOOL_TYPE}', toolType);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: filledPrompt },
      ],
      temperature: 0.2,
    });
    const responseText = completion.choices[0].message.content;
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("AI did not return valid JSON.");
    }
    const jsonString = responseText.substring(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error in runMetadataBrain:", error.message);
    throw new Error('Failed to generate metadata.');
  }
}

export async function findMatchingTool(c, userPrompt) {
  const supabase = getSupabaseClient(c);
  console.log(`[SmartCheck] Running vector search for: "${userPrompt}"`);
  
  try {
    const query_embedding = await getEmbedding(c, userPrompt);
    const { data, error } = await supabase.rpc('match_tool', {
      query_embedding,
      match_threshold: 0.67,
      match_count: 1
    });
    if (error) throw error;
    if (data && data.length > 0) {
      console.log(`[SmartCheck] Vector match found! Serving tool: "${data[0].name}"`);
      return data[0].generated_html;
    }
    console.log('[SmartCheck] No vector match found.');
    return null;
  } catch (error) {
    console.error('[SmartCheck] Vector search failed:', error.message);
    return null;
  }
}