// config/openaiClient.js
require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI();

module.exports = { openai };