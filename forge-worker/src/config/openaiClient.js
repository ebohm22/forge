// config/openaiClient.js
import { OpenAI } from 'openai';

// NOTE: We will pass the env vars from the Hono context (c.env)
// instead of process.env, so we don't initialize here.
export const getOpenAIClient = (c) => {
  return new OpenAI({
    apiKey: c.env.OPENAI_API_KEY
  });
};