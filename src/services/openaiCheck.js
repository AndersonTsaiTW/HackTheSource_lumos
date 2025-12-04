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
  "confidence": 0-100,
  "reason": "reason for determination",
  "keywords": ["keyword1", "keyword2"],
  "urgency_level": 0-10,
  "threat_level": 0-10,
  "temptation_level": 0-10,
  "impersonation_type": "bank|government|courier|company|lottery|tech_support|null",
  "action_requested": "click_link|call_number|transfer_money|provide_info|download|reply|null",
  "grammar_quality": 0-10,
  "emotion_triggers": ["fear", "greed", "urgency", "curiosity", "trust"],
  "credibility_score": 0-10
}

Field explanations:
- urgency_level: How urgent or time-sensitive the message appears (0=none, 10=extreme)
- threat_level: Presence of threatening language or consequences (0=none, 10=severe)
- temptation_level: Appeal to greed or desire (prizes, money, deals) (0=none, 10=extreme)
- impersonation_type: What entity is being impersonated (or null if none)
- action_requested: Primary action the message wants recipient to take
- grammar_quality: Quality of grammar and spelling (0=very poor, 10=perfect)
- emotion_triggers: List of emotions being manipulated
- credibility_score: How legitimate the message appears (0=obviously fake, 10=highly credible)`;

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
