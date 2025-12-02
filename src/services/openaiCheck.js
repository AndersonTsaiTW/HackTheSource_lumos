import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze message content for scam detection using OpenAI
 */
export async function analyzeWithOpenAI(content) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API Key not configured');
      return { isScam: false, confidence: 0, reason: 'API Key not configured' };
    }

    const prompt = `You are a professional scam message detection expert. Please analyze the following message content to determine if it's a scam, and respond in JSON format.

Message content:
"""
${content}
"""

Please respond in the following JSON format:
{
  "isScam": true/false,
  "confidence": 0-100 (confidence level),
  "reason": "reason for determination",
  "keywords": ["keyword1", "keyword2"]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a scam message detection expert specializing in identifying common scam tactics in Taiwan (including fake banks, lottery notifications, package scams, etc.). Please respond in English and strictly follow JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('❌ OpenAI API error:', error.message);
    return { 
      isScam: false, 
      confidence: 0, 
      reason: 'AI analysis failed', 
      error: error.message 
    };
  }
}
