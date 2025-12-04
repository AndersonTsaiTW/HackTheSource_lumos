import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 3000,
  googleSafeBrowsingApiKey: process.env.GOOGLE_SAFE_BROWSING_API_KEY,
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
  },
  openaiApiKey: process.env.OPENAI_API_KEY,
  xgboostApiUrl: process.env.XGBOOST_API_URL || 'http://localhost:5000',
};
