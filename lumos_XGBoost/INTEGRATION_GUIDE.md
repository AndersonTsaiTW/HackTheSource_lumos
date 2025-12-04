# 🔗 Node.js 整合指南

## 📦 安裝步驟

### 1. 將此資料夾移到你的 Node 專案中

```bash
# 假設你的 Node 專案在 /path/to/your-node-project
cp -r HackTheSource_Model /path/to/your-node-project/ml-model
```

### 2. 安裝 Python 依賴

```bash
cd ml-model
python -m venv .venv
.venv\Scripts\activate  # Windows
# 或 source .venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
```

### 3. 安裝 Node.js 依賴

在你的 Node 專案根目錄:

```bash
npm install axios
# 或如果你偏好 fetch API (Node 18+)，可以不用 axios
```

---

## 🚀 啟動 API 服務

### 方式 1: 手動啟動 (開發環境)

```bash
cd ml-model
.venv\Scripts\activate
python api_server.py
```

服務會在 `http://localhost:5000` 啟動

### 方式 2: 用 Node.js 自動啟動 (推薦)

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
