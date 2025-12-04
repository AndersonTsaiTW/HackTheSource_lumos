# XGBoost Integration Guide

## Architecture Overview

The system uses a **dual-service architecture** with Node.js and Python services running in parallel:

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                              │
│                    (Browser/API)                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Node.js Express      │
              │   (Port 3000)          │
              │                        │
              │  - OCR Service         │
              │  - Parser              │
              │  - Google Safe Browse  │
              │  - Twilio Lookup       │
              │  - OpenAI Analysis     │
              │  - Feature Extractor   │
              └───────────┬────────────┘
                          │
                          │ HTTP Request
                          │ (45 features)
                          ▼
              ┌────────────────────────┐
              │   Python Flask API     │
              │   (Port 5000)          │
              │                        │
              │  - XGBoost Model       │
              │  - Scam Prediction     │
              │  - Return Probability  │
              └────────────────────────┘
```

## Scoring Mechanism

### Hybrid Scoring System

The system uses a **hybrid scoring mechanism** that combines machine learning models with rule-based scoring:

1. **When XGBoost is Available** (Recommended):
   - ML Model: 70% weight
   - Google Safe Browsing: 15% weight
   - Twilio Phone Check: 10% weight
   - OpenAI Analysis: 5% weight

2. **When XGBoost is Unavailable** (Fallback Mode):
   - Google Safe Browsing: 40% weight
   - Twilio Phone Check: 30% weight
   - OpenAI Analysis: 30% weight

### Feature Extraction (45 Features)

The system automatically extracts 45 features from messages:

- **Text Features (14)**: Character count, word count, digit ratio, uppercase ratio, special characters, etc.
- **URL Features (8)**: URL count, suspicious TLD, IP address, URL shortener, HTTPS, etc.
- **Phone Features (7)**: Phone count, VoIP, validity, carrier, etc.
- **AI Features (12)**: Urgency level, threat level, temptation level, impersonation type, etc.
- **Statistical Features (3)**: Entropy, readability, sentence complexity
- **URL Safety (1)**: Google Safe Browsing result

## Quick Start

### 1. Install Dependencies

#### Node.js Dependencies
```bash
npm install
```

#### Python Dependencies
```bash
cd lumos_XGBoost
pip install -r requirements.txt
cd ..
```

### 2. Start Services

#### Option 1: One-Command Start (Recommended)
```bash
npm run start:all
```

This will start both:
- Node.js API (Port 3000)
- Python Flask API (Port 5000)

#### Option 2: Start Separately

**Terminal 1 - Node.js API:**
```bash
npm run dev
```

**Terminal 2 - Python API:**
```bash
npm run ml:start
# or
cd lumos_XGBoost
python api_server.py
```

### 3. Test Integration

#### Health Check
```bash
# Check Node.js API
curl http://localhost:3000

# Check Python API
curl http://localhost:5000/health
```

#### Analyze Message
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Congratulations! You won a prize! Click http://bit.ly/scam123 immediately to claim. Contact: 0912345678"
  }'
```

#### Expected Response
```json
{
  "riskLevel": "red",
  "riskScore": 92,
  "mlScore": 95,
  "evidence": [
    "🤖 ML Model: 95% scam probability (High confidence)",
    "⚠️ URL is shortened link",
    "⚠️ Phone is VoIP, commonly used in scams",
    "🔍 AI Analysis: Likely Scam",
    "   Reason: Contains urgency keywords and prize claims"
  ],
  "action": {
    "title": "🚨 High Risk Warning",
    "suggestions": [...]
  }
}
```

## Environment Variables

Add to your `.env` file:

```env
# Node.js API
PORT=3000
GOOGLE_SAFE_BROWSING_API_KEY=your_key
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
OPENAI_API_KEY=your_key

# XGBoost API URL
XGBOOST_API_URL=http://localhost:5000
```

## Degradation Strategy

The system implements a **graceful degradation** mechanism:

1. Attempts to connect to Python API on startup
2. If Python API is unavailable:
   - System continues to operate
   - Uses rule-based scoring
   - Logs warning messages
3. Automatically uses ML model when Python API recovers

This ensures high system availability!

## Troubleshooting

### Python API Won't Start

1. Confirm Python 3.x is installed
2. Confirm all dependencies are installed:
   ```bash
   cd lumos_XGBoost
   pip install -r requirements.txt
   ```
3. Confirm model file exists:
   ```bash
   ls lumos_XGBoost/scam_detector_model.pkl
   ```
4. If model doesn't exist, run training:
   ```bash
   cd lumos_XGBoost
   python train_model.py
   ```

### Port Conflict

If Port 5000 is occupied, modify `.env`:
```env
XGBOOST_API_URL=http://localhost:5001
```

Then modify the startup port in `lumos_XGBoost/api_server.py`.

### Feature Mismatch

If feature count doesn't match, ensure:
1. `featureExtractor.js` extracts 45 features
2. `feature_columns.json` contains all feature names
3. Model training uses the same features

## Performance Metrics

- **Node.js API Response Time**: ~500-800ms
  - OCR: 200-300ms
  - Google/Twilio/OpenAI (parallel): 200-400ms
  - Feature Extraction: 10-20ms
  - XGBoost Prediction: 50-100ms
  
- **XGBoost Model Performance**:
  - Accuracy: 78.3%
  - ROC-AUC: 0.938
  - F1 Score: 0.830

## Development Recommendations

1. **Development Stage**: Use `npm run start:all` to run both services
2. **Production Environment**: 
   - Use PM2 to manage Node.js service
   - Use gunicorn to manage Python service
   - Configure Nginx reverse proxy
3. **Monitoring**: 
   - Monitor Python API health status
   - Log ML model prediction results
   - Track degradation events
