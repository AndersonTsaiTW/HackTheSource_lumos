# 詐騙簡訊偵測模型

使用 XGBoost 訓練的詐騙簡訊分類模型，並提供 REST API 供 Node.js 調用。

## 📊 模型資訊

- **訓練資料**: 111 筆簡訊 (77 筆詐騙, 34 筆正常)
- **演算法**: XGBoost
- **特徵數**: 33 個
- **測試準確率**: 78.3%
- **ROC-AUC**: 0.938
- **交叉驗證 F1**: 0.830 (±0.089)

## 🚀 快速開始

### 1. 安裝 Python 相依套件

```bash
pip install -r requirements.txt
```

### 2. 訓練模型

```bash
python train_model.py
```

這會產生：
- `scam_detector_model.pkl` - 訓練好的模型
- `feature_importance.png` - 特徵重要性圖表
- `model_metrics.json` - 模型評估指標
- `feature_columns.json` - 特徵欄位清單

### 3. 測試預測功能

```bash
python predict.py
```

### 4. 啟動 API 服務

```bash
python api_server.py
```

服務會在 `http://localhost:5000` 啟動

## 🌐 API 端點

### 健康檢查
```http
GET /health
```

### 單一訊息預測
```http
POST /predict
Content-Type: application/json

{
  "message_length": 300,
  "contains_urgent_words": 1,
  "contains_money_keywords": 1,
  ...
}
```

### 批次預測
```http
POST /predict/batch
Content-Type: application/json

{
  "messages": [
    {...特徵1...},
    {...特徵2...}
  ]
}
```

### 模型資訊
```http
GET /model/info
```

## 📱 Node.js 整合

### 1. 安裝 Node.js 相依套件

```bash
npm install
```

### 2. 執行範例

```bash
node nodejs_example.js
```

### 3. 在你的 Node.js 專案中使用

```javascript
const { detectScam } = require('./nodejs_example');

// 準備訊息特徵
const messageFeatures = {
  message_length: 300,
  contains_urgent_words: 1,
  contains_money_keywords: 1,
  // ... 其他特徵
};

// 預測
const result = await detectScam(messageFeatures);

if (result.success) {
  console.log('是否為詐騙:', result.result.is_scam);
  console.log('詐騙機率:', result.result.scam_probability);
  console.log('信心等級:', result.result.confidence);
}
```

## 🔑 重要特徵 (Top 10)

1. `avg_word_length` - 平均字詞長度 (18.81%)
2. `digit_ratio` - 數字比例 (13.86%)
3. `exclamation_count` - 驚嘆號數量 (8.63%)
4. `openai_credibility_score` - OpenAI 可信度分數 (8.16%)
5. `question_count` - 問號數量 (7.42%)
6. `openai_grammar_quality` - 文法品質 (6.97%)
7. `openai_urgency_level` - 緊急程度 (6.94%)
8. `special_char_count` - 特殊字元數量 (6.39%)
9. `openai_temptation_level` - 誘惑程度 (6.03%)
10. `contains_link_text` - 包含連結文字 (5.13%)

## 📂 檔案結構

```
HackTheSource_Model/
├── training_data.csv          # 訓練資料
├── train_model.py             # 模型訓練腳本
├── predict.py                 # 預測腳本
├── api_server.py              # Flask API 服務
├── nodejs_example.js          # Node.js 整合範例
├── requirements.txt           # Python 相依套件
├── package.json               # Node.js 相依套件
├── scam_detector_model.pkl    # 訓練好的模型
├── feature_importance.png     # 特徵重要性圖表
├── model_metrics.json         # 模型評估指標
└── feature_columns.json       # 特徵欄位清單
```

## ⚠️ 注意事項

1. **資料量較小**: 目前只有 111 筆訓練資料，建議持續收集更多樣本以提升模型效能
2. **類別不平衡**: 詐騙:正常 = 2.26:1，已使用 class_weight 處理
3. **誤判率**: 目前可能會有較高的誤判率（把正常訊息判為詐騙），實際使用時需要調整閾值
4. **特徵工程**: 模型效能高度依賴特徵提取的品質

## 🔄 改進建議

1. **增加訓練資料**: 收集更多正常簡訊樣本（目標 500-1000 筆）
2. **調整閾值**: 根據實際需求調整分類閾值（預設 0.5）
3. **特徵優化**: 分析誤判案例，優化特徵提取邏輯
4. **定期重訓**: 隨著資料累積定期重新訓練模型

## 📞 問題回報

如有任何問題或建議，請開 issue 討論。
