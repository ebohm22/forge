// src/config/openaiClient.js
import { OpenAI } from 'openai';

// This function gets the environment variables from Hono's context ('c')
export const getOpenAIClient = (c) => {
  return new OpenAI({
    apiKey: c.env.OPENAI_API_KEY
  });
};