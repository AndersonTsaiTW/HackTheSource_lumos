# Scam Message Detection

Hackathon Project - Scam message detection built with Node.js + Express  
Introduction Document: [Lumos - Clarity_in_Digital_Trust](https://github.com/AndersonTsaiTW/HackTheSource_lumos/blob/main/Lumos_Clarity_in_Digital_Trust.pdf)
## Features

- 📝 **Smart Parsing**: Extract URLs, phone numbers, and content from messages using Regex
- 🌐 **URL Detection**: Integrate Google Safe Browsing API to check malicious links
- 📞 **Phone Lookup**: Verify phone numbers using Twilio Lookup API
- 🤖 **AI Analysis**: OpenAI GPT-4 intelligent scam detection
- ⚡ **Parallel Processing**: Call three APIs simultaneously for fast response
- 🎨 **Risk Assessment**: Red warning, yellow caution, green safe

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your API Keys:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
GOOGLE_SAFE_BROWSING_API_KEY=your_api_key_here
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
OPENAI_API_KEY=your_api_key_here
```

### 3. Start Server

```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:3000`

## API Documentation

### POST /api/analyze

Analyze suspicious messages

**Request Body:**

```json
{
  "message": "Your package has arrived, please click http://suspicious-link.com for details. Contact: 0912345678"
}
```

**Response:**

```json
{
  "riskLevel": "red",
  "riskScore": 85,
  "evidence": [
    "⚠️ URL flagged by Google as Phishing",
    "⚠️ Phone is VoIP, commonly used in scams",
    "🤖 AI determined as scam (confidence: 92%)"
  ],
  "action": {
    "title": "🚨 High Risk Warning",
    "suggestions": [
      "Do not click any links",
      "Do not call back the phone number",
      "Block this number immediately"
    ]
  }
}
```

## Project Structure

```
src/
├── index.js              # Express application entry
├── config.js             # Environment variables configuration
├── routes/
│   └── analyze.js        # Analysis route
├── services/
│   ├── parser.js         # Message parsing
│   ├── safeBrowsing.js   # Google Safe Browsing
│   ├── twilioLookup.js   # Twilio phone lookup
│   └── openaiCheck.js    # OpenAI scam analysis
└── utils/
    └── analyzer.js       # Risk assessment logic
```

## Tech Stack

- **Framework**: Express.js
- **HTTP Client**: Axios
- **AI**: OpenAI GPT-4
- **APIs**: Google Safe Browsing v4, Twilio Lookup v2

## Development Tips

- Use `nodemon` for development with auto-restart on file changes
- Keep API Keys secure, do not commit to Git
- Test API with Postman or curl

## License

MIT
