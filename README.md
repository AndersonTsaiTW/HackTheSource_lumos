# Scam Message Detection

Hackathon Project - AI-powered scam detection system with frontend + backend + machine learning training pipeline

Introduction Document: [Lumos - Clarity_in_Digital_Trust](https://github.com/AndersonTsaiTW/HackTheSource_lumos/blob/main/Lumos_Clarity_in_Digital_Trust.pdf)

## Features

### Production API (For End Users)

- 📝 **Smart Parsing**: Extract URLs, phone numbers, and content from messages using Regex
- 🌐 **URL Detection**: Google Safe Browsing API to detect malicious links
- 📞 **Phone Lookup**: Twilio Lookup API to verify phone numbers and detect VoIP
- 🤖 **AI Analysis**: OpenAI GPT-4o-mini with 12 semantic features (urgency, threat level, impersonation type, etc.)
- 📸 **OCR Support**: Tesseract.js for extracting text from scam message images
- ⚡ **Parallel Processing**: Call three APIs simultaneously for fast response
- 🎨 **Risk Assessment**: Red warning (≥60), yellow caution (≥30), green safe (<30)
- 🌐 **Web Interface**: Modern responsive UI with dark/light mode

### XGBoost ML Model (Machine Learning)

- 🎯 **45 Features**: Comprehensive feature engineering from text, URL, phone, AI, and statistical analysis
- 🤖 **XGBoost Classifier**: Trained model with 78.3% accuracy and 0.938 ROC-AUC score
- 🔮 **Scam Probability**: Returns precise probability score (0-100%) for scam detection
- 🐍 **Python API Server**: Flask-based REST API for model inference
- 🔄 **Node.js Integration**: Easy integration with existing Node.js backend
- 📊 **Model Metrics**: Detailed performance metrics and feature importance visualization

### Training Data Collection (For ML Model)

- 🎯 **45 Feature Extraction**: Comprehensive feature engineering for XGBoost training
  - Text features (14): character count, word count, digit ratio, special chars, etc.
  - URL features (8): URL count, suspicious domains, HTTPS ratio, etc.
  - Phone features (7): phone count, VoIP detection, international format, etc.
  - AI features (12): urgency level, threat level, temptation level, impersonation type, emotion triggers, etc.
  - Statistical features (3): entropy, readability, complexity
- 📊 **CSV Export**: Automated training data generation to `training_data.csv`
- 🖼️ **Batch Processing**: Process 100+ images from `data_pics/fraud` and `data_pics/normal` folders
- 🔄 **API Integration**: Reuses production APIs (Google, Twilio, OpenAI) for consistent feature extraction

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

### Production Endpoints

#### POST /api/analyze

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
    "🤖 AI detected scam indicators",
    "   Reason: Contains urgency keywords and suspicious link"
  ],
  "action": {
    "title": "🚨 High Risk Warning",
    "suggestions": [
      "Do not click any links",
      "Do not call back the phone number",
      "Block this number immediately",
      "Report to 165 anti-fraud hotline"
    ]
  },
  "parsed": {
    "url": "http://suspicious-link.com",
    "phone": "0912345678",
    "content": "Your package has arrived, please click..."
  }
}
```

#### POST /api/ocr

Extract text from image and analyze for scams

**Request:**

- Method: POST
- Content-Type: multipart/form-data
- Body: `image` file (JPG, PNG, GIF, WebP, TIFF, max 10MB)

**Response:**

```json
{
  "text": "Extracted text from image...",
  "riskScore": 85,
  "riskLevel": "red",
  "evidence": [...],
  "action": {...}
}
```

### Training Endpoints

#### POST /api/training/collect-training-data

Collect training data with 45 features for ML model

**Request Body:**

```json
{
  "image_path": "data_pics/fraud/scam_001.png",
  "ocr_text": "URGENT! Click http://phishing.com",
  "label": 1
}
```

**Response:**

```json
{
  "success": true,
  "message": "Training data collected successfully",
  "features": {
    "char_count": 156,
    "word_count": 23,
    "url_count": 1,
    "phone_count": 1,
    "urgency_level": 8,
    "threat_level": 7
  },
  "label": 1
}
```

#### GET /api/training/training-stats

Get statistics about collected training data

**Response:**

```json
{
  "totalRows": 128,
  "features": 45,
  "lastUpdated": "2025-12-04T10:30:00.000Z"
}
```

## Project Structure

```text
.
├── src/                          # Production code
│   ├── index.js                  # Main server (unified)
│   ├── config.js                 # Environment variables
│   ├── routes/
│   │   └── analyze.js            # /api/analyze, /api/ocr
│   ├── services/
│   │   ├── parser.js             # Message parsing (URL, phone)
│   │   ├── safeBrowsing.js       # Google Safe Browsing API
│   │   ├── twilioLookup.js       # Twilio Lookup API
│   │   ├── openaiCheck.js        # OpenAI GPT-4o-mini (12 features)
│   │   └── ocrService.js         # Tesseract.js OCR
│   └── utils/
│       └── analyzer.js           # Risk score calculation
│
├── training/                     # ML training pipeline
│   ├── routes/
│   │   └── collectData.js        # /api/training/*
│   ├── services/
│   │   └── featureExtractor.js   # 45 feature extraction
│   ├── utils/
│   │   └── csvWriter.js          # CSV file management
│   └── scripts/
│       ├── test-collect.js       # Test single sample
│       └── scan-images.js        # Batch process images
│
├── data_pics/                    # Training images
│   ├── fraud/                    # 85 scam images
│   └── normal/                   # 43 normal images
│
├── lumos_XGBoost/                # ML Model (Python)
│   ├── api_server.py             # Flask API server
│   ├── train_model.py            # Model training script
│   ├── predict.py                # Prediction script
│   ├── scam_detector_model.pkl   # Trained XGBoost model
│   ├── feature_columns.json      # 45 feature definitions
│   ├── model_metrics.json        # Performance metrics
│   ├── requirements.txt          # Python dependencies
│   ├── nodejs_example.js         # Node.js integration example
│   └── README.md                 # Model documentation
│
├── test.html                     # Web UI
├── styles/                       # CSS files
├── scripts/                      # Frontend JS
└── training_data.csv             # Generated training data
```

## Tech Stack

### Backend & APIs

- **Runtime**: Node.js v22.13.0
- **Framework**: Express.js
- **HTTP Client**: Axios
- **AI**: OpenAI GPT-4o-mini
- **OCR**: Tesseract.js
- **APIs**: Google Safe Browsing v4, Twilio Lookup v2

### Machine Learning

- **Model**: XGBoost Classifier
- **Language**: Python 3.x
- **API Framework**: Flask + Flask-CORS
- **Libraries**: pandas, numpy, scikit-learn, xgboost, joblib
- **Accuracy**: 78.3% with 0.938 ROC-AUC

### Frontend

- **UI**: Vanilla HTML/CSS/JS with dark mode
- **Styling**: SCSS preprocessor

## Training Data Collection

### How to Collect Training Data

1. **Prepare images**: Place images in `data_pics/fraud/` (label=1) or `data_pics/normal/` (label=0)

2. **Start server**:

```bash
npm run dev
```

1. **Run batch processing** (in another terminal):

```bash
node training/scripts/scan-images.js
```

This will:

- Scan all images in `data_pics/fraud/` and `data_pics/normal/`
- Extract text using OCR
- Call Google, Twilio, and OpenAI APIs
- Extract 45 features
- Append to `training_data.csv`

### Feature List (45 Total)

**Text Features (14)**:

- char_count, word_count, digit_count, digit_ratio
- uppercase_ratio, special_char_count, exclamation_count
- question_count, has_urgent_keywords, suspicious_word_count
- max_word_length, avg_word_length, emoji_count, consecutive_caps

**URL Features (8)**:

- url_count, has_suspicious_tld, has_ip_address
- has_url_shortener, avg_url_length, has_https
- url_path_depth, subdomain_count

**Phone Features (7)**:

- phone_count, has_intl_code, is_voip
- is_mobile, is_valid_phone, phone_carrier_known, has_multiple_phones

**AI Features (12)**:

- urgency_level (0-10), threat_level (0-10), temptation_level (0-10)
- impersonation_type, action_requested, grammar_quality (0-10)
- emotion_triggers, credibility_score (0-10)
- ai_is_scam (0/1), ai_confidence (0-100), has_scam_keywords, keyword_count

**Statistical Features (3)**:

- text_entropy, readability_score, sentence_complexity

## XGBoost Model Usage

The XGBoost model is a Python-based machine learning model that can predict scam probability based on 45 extracted features.

### Setup XGBoost Model

1. **Navigate to the model directory**:

```bash
cd lumos_XGBoost
```

1. **Install Python dependencies**:

```bash
pip install -r requirements.txt
```

1. **Train the model** (optional, model is pre-trained):

```bash
python train_model.py
```

1. **Start the Flask API server**:

```bash
python api_server.py
```

The API will run on `http://localhost:5000`

### XGBoost API Endpoints

#### Health Check

```http
GET http://localhost:5000/health
```

#### Predict Scam Probability

```http
POST http://localhost:5000/predict
Content-Type: application/json

{
  "char_count": 156,
  "word_count": 23,
  "url_count": 1,
  "phone_count": 1,
  "urgency_level": 8,
  "threat_level": 7,
  ... (all 45 features)
}
```

**Response:**

```json
{
  "scam_probability": 0.87,
  "is_scam": true,
  "confidence": "high"
}
```

#### Get Model Information

```http
GET http://localhost:5000/model/info
```

### Integration with Node.js Backend

See `lumos_XGBoost/nodejs_example.js` for integration example. The Node.js backend can:

1. Extract 45 features using existing services (parser, safeBrowsing, twilioLookup, openaiCheck, featureExtractor)
2. Send features to XGBoost Flask API at `http://localhost:5000/predict`
3. Receive scam probability (0-100%) from the model
4. Combine with existing rule-based risk score for final decision

For detailed integration guide, see `lumos_XGBoost/INTEGRATION_GUIDE.md`

## Development Tips

- Use `nodemon` for development with auto-restart on file changes
- Keep API Keys secure, do not commit to Git
- Test API with Postman, curl, or the web interface (`test.html`)
- Training data is saved to `training_data.csv` (gitignored)
- Each API call costs money - be mindful when batch processing

## License

MIT
