# 🔗 Node.js Integration & Separation Guide

> **Note**: This project is already integrated. This guide explains:
> 1. How to verify the integration is working
> 2. How to separate the ML model into a standalone service if needed

---

## 📋 Current Integration Status

### ✅ Already Integrated Components

1. **Node.js Services** (in `src/services/`)
   - `xgboostService.js` - Calls Python API
   - `featureExtractor.js` - Extracts 45 features
   - `analyzer.js` - Hybrid scoring (ML + rules)

2. **Python ML Model** (in `lumos_XGBoost/`)
   - `api_server.py` - Flask API server
   - `scam_detector_model.pkl` - Trained XGBoost model
   - `requirements.txt` - Python dependencies

3. **Configuration**
   - `package.json` - npm scripts for dual-service startup
   - `src/config.js` - XGBoost API URL configuration

---

## 🚀 Quick Start (Use Current Integration)

### 1. Complete Setup (First Time Only)

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
cd lumos_XGBoost
pip install -r requirements.txt
cd ..

# Add to .env file
echo "XGBOOST_API_URL=http://localhost:5000" >> .env
```

### 2. Start Both Services

```bash
# One command to start both Node.js and Python services
npm run start:all
```

This will:
- Start Node.js API on `http://localhost:3000`
- Start Python Flask API on `http://localhost:5000`

### 3. Test the Integration

```bash
# Test Node.js API (should call Python internally)
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"message": "URGENT! Click http://bit.ly/scam to claim prize! Call 0912345678"}'
```

Expected response includes:
```json
{
  "riskScore": 85,
  "mlScore": 90,
  "riskLevel": "red",
  "evidence": [
    "🤖 ML Model: 90% scam probability (High confidence)",
    ...
  ]
}
```

---

## 🔧 Troubleshooting Current Integration

### Issue: Missing XGBOOST_API_URL

**Symptom**: ML model not being used, only rule-based scoring

**Solution**: Add to `.env`
```env
XGBOOST_API_URL=http://localhost:5000
```

### Issue: Python Dependencies Not Installed

**Symptom**: `ModuleNotFoundError` when starting Python service

**Solution**:
```bash
cd lumos_XGBoost
pip install -r requirements.txt
```

### Issue: Model File Not Found

**Symptom**: `Model not loaded` error

**Solution**: Train the model
```bash
cd lumos_XGBoost
python train_model.py
```

---

## 📦 How to Separate ML Model (Optional)

If you want to deploy the ML model as a separate microservice:

### Option 1: Separate to Different Server

#### Step 1: Extract ML Model to Separate Project

```bash
# On your ML server
mkdir scam-detection-ml-service
cd scam-detection-ml-service

# Copy only ML files
cp -r /path/to/HackTheSource_Lumos/lumos_XGBoost/* .

# Install dependencies
pip install -r requirements.txt

# Start service (use production server)
gunicorn -w 4 -b 0.0.0.0:5000 api_server:app
```

#### Step 2: Update Node.js Project

In your Node.js project, update `.env`:
```env
# Point to remote ML service
XGBOOST_API_URL=http://ml-server.yourcompany.com:5000
```

Remove from `package.json` scripts:
```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
    // Remove: "ml:start" and "start:all"
  }
}
```

Keep these Node.js files (they still need to call remote ML service):
- `src/services/xgboostService.js`
- `src/services/featureExtractor.js`
- `src/utils/analyzer.js`

### Option 2: Dockerize ML Service

#### Create `lumos_XGBoost/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "api_server:app"]
```

#### Create `lumos_XGBoost/docker-compose.yml`

```yaml
version: '3.8'

services:
  ml-service:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - ./scam_detector_model.pkl:/app/scam_detector_model.pkl
      - ./feature_columns.json:/app/feature_columns.json
    environment:
      - FLASK_ENV=production
    restart: always
```

#### Run ML Service in Docker

```bash
cd lumos_XGBoost
docker-compose up -d
```

#### Update Node.js Project

```env
# .env
XGBOOST_API_URL=http://localhost:5000
# or for remote: http://ml-container:5000
```

---

## 🏗️ Separation Benefits vs Drawbacks

### Keep Integrated (Current Setup)

**Pros:**
- ✅ Simple deployment (one project)
- ✅ Easy local development
- ✅ No network latency between services
- ✅ Easier debugging

**Cons:**
- ❌ Python + Node.js on same server
- ❌ Can't scale ML service independently
- ❌ More complex dependency management

### Separate Services

**Pros:**
- ✅ Independent scaling (scale ML service separately)
- ✅ Independent deployment and updates
- ✅ Better resource management
- ✅ Can reuse ML service for other projects

**Cons:**
- ❌ Network latency between services
- ❌ More complex deployment
- ❌ Need to manage two projects
- ❌ Potential network failures

---

## 📊 API Endpoints Reference

### 1. Health Check

```http
GET http://localhost:5000/health
```

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### 2. Single Prediction

```http
POST http://localhost:5000/predict
Content-Type: application/json
```

**Request Body:**
```json
{
  "char_count": 156,
  "word_count": 23,
  "url_count": 1,
  "phone_count": 1,
  "urgency_level": 8,
  "threat_level": 7,
  ... (45 features total)
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "is_scam": true,
    "scam_probability": 0.8435,
    "normal_probability": 0.1565,
    "confidence": "High",
    "prediction_label": "Scam"
  }
}
```

### 3. Batch Prediction

```http
POST http://localhost:5000/predict/batch
Content-Type: application/json
```

**Request Body:**
```json
{
  "messages": [
    {...features1...},
    {...features2...}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {...result1...},
    {...result2...}
  ],
  "count": 2
}
```

### 4. Model Info

```http
GET http://localhost:5000/model/info
```

**Response:**
```json
{
  "success": true,
  "info": {
    "feature_count": 45,
    "features": ["char_count", "word_count", ...]
  }
}
```

---

## 💻 Usage in Node.js

### Option 1: Use Example Module

```javascript
const { detectScam } = require('./lumos_XGBoost/nodejs_example');

// Prepare message features (45 features)
const features = {
  char_count: 156,
  word_count: 23,
  url_count: 1,
  phone_count: 1,
  urgency_level: 8,
  // ... other features
};

// Predict
const result = await detectScam(features);
console.log('Is scam:', result.result.is_scam);
console.log('Probability:', result.result.scam_probability);
```

### Option 2: Create Your Own Service

```javascript
const axios = require('axios');

class ScamDetectionService {
  constructor(apiUrl = 'http://localhost:5000') {
    this.apiUrl = apiUrl;
  }

  async predict(features) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/predict`,
        features
      );
      return response.data;
    } catch (error) {
      console.error('Prediction failed:', error.message);
      throw error;
    }
  }

  async checkHealth() {
    const response = await axios.get(`${this.apiUrl}/health`);
    return response.data;
  }
}

// Usage
const detector = new ScamDetectionService();
const result = await detector.predict(messageFeatures);
```

---

## 🔧 Required Features (45 Total)

### Text Features (14)
- char_count, word_count, digit_count, digit_ratio
- uppercase_ratio, special_char_count, exclamation_count
- question_count, has_urgent_keywords, suspicious_word_count
- max_word_length, avg_word_length, emoji_count, consecutive_caps

### URL Features (8)
- url_count, has_suspicious_tld, has_ip_address
- has_url_shortener, avg_url_length, has_https
- url_path_depth, subdomain_count

### Phone Features (7)
- phone_count, has_intl_code, is_voip
- is_mobile, is_valid_phone, phone_carrier_known, has_multiple_phones

### AI Features (12)
- urgency_level, threat_level, temptation_level
- impersonation_type, action_requested, grammar_quality
- emotion_triggers, credibility_score
- ai_is_scam, ai_confidence, has_scam_keywords, keyword_count

### Statistical Features (3)
- text_entropy, readability_score, sentence_complexity

### URL Safety (1)
- google_safe_browsing_flagged

---

## 📊 Response Format

```javascript
{
  is_scam: boolean,              // true if message is classified as scam
  scam_probability: number,      // 0.0 to 1.0
  normal_probability: number,    // 0.0 to 1.0
  confidence: string,            // "Low", "Medium", "High"
  prediction_label: string       // "Scam" or "Normal"
}
```

### Confidence Levels
- **High**: probability > 0.75
- **Medium**: 0.60 <= probability <= 0.75
- **Low**: probability < 0.60

---

## 🐛 Troubleshooting

### Issue 1: Connection Failed (ECONNREFUSED)
**Solution**: Ensure Python API service is running at port 5000
```bash
python lumos_XGBoost/api_server.py
```

### Issue 2: Model Load Failed
**Solution**: Train the model first
```bash
cd lumos_XGBoost
python train_model.py
```

### Issue 3: Prediction Error (Missing Features)
**Solution**: Ensure all 45 features are provided. Check `feature_columns.json` for required feature names.

### Issue 4: Chinese Text Encoding
**Solution**: Ensure UTF-8 encoding in API requests
```javascript
axios.post(url, data, {
  headers: { 'Content-Type': 'application/json; charset=UTF-8' }
})
```

---

## 🔒 Production Recommendations

1. **Use Process Manager**
   ```bash
   # For Python service
   gunicorn -w 4 -b 0.0.0.0:5000 api_server:app
   
   # For Node.js service
   pm2 start src/index.js
   ```

2. **Add Health Monitoring**
   - Monitor Python API uptime
   - Implement auto-restart on failure
   - Log prediction results

3. **Security**
   - Add API authentication
   - Rate limiting
   - Input validation

4. **Performance**
   - Use connection pooling
   - Cache frequent predictions
   - Batch requests when possible

---

## 📝 Testing

Run the test script:
```bash
node lumos_XGBoost/nodejs_example.js
```

Expected output:
```
==========================================================
🔍 Node.js Scam SMS Detection Example
==========================================================

1️⃣ Checking service status...
   Service status: { status: 'healthy', model_loaded: true }

2️⃣ Getting model information...
   Feature count: 45

3️⃣ Testing scam message detection...
   ✅ Prediction: Scam (84.35%)
   Confidence: High
```

---

## 📞 Need Help?

For more information, see:
- Main integration guide: [XGBOOST_INTEGRATION.md](../XGBOOST_INTEGRATION.md)
- Model documentation: [README.md](README.md)
- Open an issue on GitHub for support

在你的 Node 專案中建立啟動腳本:

```javascript
// start-ml-service.js
const { spawn } = require('child_process');
const path = require('path');

const pythonPath = path.join(__dirname, 'ml-model', '.venv', 'Scripts', 'python.exe');
const scriptPath = path.join(__dirname, 'ml-model', 'api_server.py');

const mlService = spawn(pythonPath, [scriptPath]);

mlService.stdout.on('data', (data) => {
  console.log(`[ML Service] ${data}`);
});

mlService.stderr.on('data', (data) => {
  console.error(`[ML Service Error] ${data}`);
});

mlService.on('close', (code) => {
  console.log(`ML Service exited with code ${code}`);
});

console.log('🚀 ML Service starting...');
```

在 `package.json` 中加入:

```json
{
  "scripts": {
    "start:ml": "node start-ml-service.js",
    "dev": "concurrently \"npm run start:ml\" \"npm run dev:server\""
  }
}
```

---

## 📡 API 端點

### 1. Health Check

```javascript
GET http://localhost:5000/health

Response:
{
  "status": "healthy",
  "model_loaded": true
}
```

### 2. 單筆預測

```javascript
POST http://localhost:5000/predict
Content-Type: application/json

Request Body:
{
  // 文本欄位 (必要 - 模型使用文本特徵)
  "message_text": "您的包裹需要補繳運費...",
  "openai_keywords": "包裹,運費,點擊",
  "openai_reason": "要求點擊可疑連結",
  "openai_emotion_triggers": "緊急,逾期",
  "openai_action_requested": "click_link",
  "openai_impersonation_type": "courier",
  
  // 數值欄位 (33個)
  "message_length": 68,
  "contains_urgent_words": 1,
  "has_url": 1,
  // ... 其他欄位
}

Response:
{
  "success": true,
  "result": {
    "is_scam": true,
    "scam_probability": 0.8435,
    "normal_probability": 0.1565,
    "confidence": "High",
    "prediction_label": "Scam",
    "top_scam_factors": [
      {
        "feature": "message_length",
        "value": 68.0,
        "importance": 0.014,
        "contribution_score": 0.952
      },
      // ... 前5名
    ]
  }
}
```

### 3. 批次預測

```javascript
POST http://localhost:5000/predict/batch
Content-Type: application/json

Request Body:
{
  "messages": [
    { /* message 1 features */ },
    { /* message 2 features */ }
  ]
}

Response:
{
  "success": true,
  "results": [
    { /* result 1 */ },
    { /* result 2 */ }
  ],
  "count": 2
}
```

### 4. 模型資訊

```javascript
GET http://localhost:5000/model/info

Response:
{
  "success": true,
  "info": {
    "feature_count": 79,
    "features": ["message_length", "tfidf_msg_0", ...]
  }
}
```

---

## 💻 在 Node.js 中使用

### 方式 1: 直接使用範例模組

```javascript
// your-app.js
const scamDetector = require('./ml-model/nodejs_example');

async function checkMessage(messageData) {
  try {
    // 單筆預測
    const result = await scamDetector.detectScam(messageData);
    
    console.log('Is scam:', result.result.is_scam);
    console.log('Probability:', result.result.scam_probability);
    console.log('Top factors:', result.result.top_scam_factors);
    
    return result.result;
  } catch (error) {
    console.error('Detection failed:', error);
    throw error;
  }
}
```

### 方式 2: 建立自己的服務類別

```javascript
// services/ScamDetectionService.js
const axios = require('axios');

class ScamDetectionService {
  constructor(apiUrl = 'http://localhost:5000') {
    this.apiUrl = apiUrl;
  }

  async predict(messageData) {
    try {
      const response = await axios.post(`${this.apiUrl}/predict`, messageData);
      return response.data.result;
    } catch (error) {
      console.error('Scam detection error:', error.message);
      throw error;
    }
  }

  async predictBatch(messages) {
    try {
      const response = await axios.post(`${this.apiUrl}/predict/batch`, {
        messages
      });
      return response.data.results;
    } catch (error) {
      console.error('Batch prediction error:', error.message);
      throw error;
    }
  }

  async isHealthy() {
    try {
      const response = await axios.get(`${this.apiUrl}/health`);
      return response.data.model_loaded;
    } catch (error) {
      return false;
    }
  }
}

module.exports = ScamDetectionService;
```

使用範例:

```javascript
const ScamDetectionService = require('./services/ScamDetectionService');
const detector = new ScamDetectionService();

// 在你的 route 或 controller 中
app.post('/api/check-sms', async (req, res) => {
  try {
    const { message_text, ...otherFeatures } = req.body;
    
    // 確保服務健康
    if (!await detector.isHealthy()) {
      return res.status(503).json({ 
        error: 'ML service unavailable' 
      });
    }
    
    // 預測
    const result = await detector.predict({
      message_text,
      ...otherFeatures
    });
    
    res.json({
      success: true,
      prediction: result
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});
```

---

## 🔧 必要欄位說明

### 文本欄位 (Text Features)
- `message_text`: 簡訊內容 (必要)
- `openai_keywords`: OpenAI 提取的關鍵字
- `openai_reason`: 判斷原因
- `openai_emotion_triggers`: 情緒觸發詞
- `openai_action_requested`: 要求的行動 (click_link, reply, call_number, provide_info)
- `openai_impersonation_type`: 冒充類型 (company, bank, government, courier)

### 數值欄位 (Numeric Features) - 33個
- `message_length`: 訊息長度
- `contains_urgent_words`: 是否包含緊急詞彙 (0/1)
- `contains_money_keywords`: 是否包含金錢關鍵字 (0/1)
- `has_url`: 是否有網址 (0/1)
- `url_is_shortened`: 是否為短網址 (0/1)
- `openai_is_scam`: OpenAI 判斷是否詐騙 (0/1)
- `openai_confidence`: OpenAI 信心分數 (0-100)
- `openai_urgency_level`: 緊急程度 (0-10)
- `openai_threat_level`: 威脅程度 (0-10)
- `openai_credibility_score`: 可信度分數 (0-10)
- ... 等 (共33個)

完整欄位列表請參考 `feature_columns.json`

---

## 📊 回傳結果說明

```javascript
{
  is_scam: boolean,              // 是否為詐騙
  scam_probability: number,      // 詐騙機率 (0-1)
  normal_probability: number,    // 正常機率 (0-1)
  confidence: string,            // 信心水準: "High" / "Medium" / "Low"
  prediction_label: string,      // 預測標籤: "Scam" / "Normal"
  top_scam_factors: [            // 前5大支持詐騙的特徵
    {
      feature: string,           // 特徵名稱
      value: number,             // 特徵值
      importance: number,        // 模型中的重要性
      contribution_score: number // 貢獻分數 = importance × value
    }
  ]
}
```

### 信心水準判定
- **High**: 詐騙機率 ≥ 80%
- **Medium**: 詐騙機率 60-80%
- **Low**: 詐騙機率 < 60%

---

## 🐛 除錯提示

### 問題 1: 連線失敗 (ECONNREFUSED)
```
解決方法: 確認 Python API 服務已啟動
python api_server.py
```

### 問題 2: 模型載入失敗
```
解決方法: 
1. 確認 scam_detector_model.pkl 存在
2. 檢查 Python 依賴是否完整安裝
   pip install -r requirements.txt
```

### 問題 3: 預測錯誤 (缺少特徵)
```
解決方法: 確保提供所有必要欄位
- 文本欄位: message_text (必要)
- 至少提供基本數值欄位，缺少的會自動填 0
```

### 問題 4: 中文亂碼
```
解決方法: 確保 API 請求使用 UTF-8 編碼
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8';
```

---

## 🔒 生產環境建議

1. **使用 PM2 管理 Python 服務**
   ```bash
   npm install -g pm2
   pm2 start api_server.py --interpreter python
   ```

2. **加入錯誤重試機制**
   ```javascript
   const axiosRetry = require('axios-retry');
   axiosRetry(axios, { retries: 3 });
   ```

3. **設定 timeout**
   ```javascript
   axios.post(url, data, { timeout: 5000 });
   ```

4. **加入快取機制** (針對相同訊息)
   ```javascript
   const cache = new Map();
   // 檢查 cache 再呼叫 API
   ```

5. **使用環境變數管理 URL**
   ```javascript
   const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5000';
   ```

---

## 📝 測試

執行範例測試:

```bash
# 1. 啟動 API 服務
cd ml-model
python api_server.py

# 2. 在另一個終端執行 Node.js 測試
node ml-model/nodejs_example.js
```

你應該會看到完整的測試結果,包括預測結果和前五大因子。

---

## 📞 需要幫助?

- 檢查 `model_metrics.json` 查看模型效能
- 檢查 `feature_importance.png` 查看特徵重要性
- 參考 `nodejs_example.js` 完整範例代碼
