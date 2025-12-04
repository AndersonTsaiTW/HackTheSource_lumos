# Scam Message Detection Model

XGBoost-based scam message classification model with REST API for Node.js integration.

## 📊 Model Information

- **Training Data**: 111 messages (77 scam, 34 normal)
- **Algorithm**: XGBoost
- **Features**: 33
- **Test Accuracy**: 78.3%
- **ROC-AUC**: 0.938
- **Cross-validated F1**: 0.830 (±0.089)

## 🚀 Quick Start

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Train Model

```bash
python train_model.py
```

This generates:
- `scam_detector_model.pkl` - Trained model
- `feature_importance.png` - Feature importance chart
- `model_metrics.json` - Model evaluation metrics
- `feature_columns.json` - Feature column list

### 3. Test Prediction

```bash
python predict.py
```

### 4. Start API Service

```bash
python api_server.py
```

Service runs at `http://localhost:5000`

## 🌐 API Endpoints

### Health Check
```http
GET /health
```

### Single Message Prediction
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

### Batch Prediction
```http
POST /predict/batch
Content-Type: application/json

{
  "messages": [
    {...features1...},
    {...features2...}
  ]
}
```

### Model Info
```http
GET /model/info
```

## 📱 Node.js Integration

### 1. Install Node.js Dependencies

```bash
npm install
```

### 2. Run Example

```bash
node nodejs_example.js
```

### 3. Use in Your Node.js Project

```javascript
const { detectScam } = require('./nodejs_example');

// Prepare message features
const messageFeatures = {
  message_length: 300,
  contains_urgent_words: 1,
  contains_money_keywords: 1,
  // ... other features
};

// Predict
const result = await detectScam(messageFeatures);

if (result.success) {
  console.log('Is scam:', result.result.is_scam);
  console.log('Scam probability:', result.result.scam_probability);
  console.log('Confidence level:', result.result.confidence);
}
```

## 🔑 Top Features (Top 10)

1. `avg_word_length` - Average word length (18.81%)
2. `digit_ratio` - Digit ratio (13.86%)
3. `exclamation_count` - Exclamation mark count (8.63%)
4. `openai_credibility_score` - OpenAI credibility score (8.16%)
5. `question_count` - Question mark count (7.42%)
6. `openai_grammar_quality` - Grammar quality (6.97%)
7. `openai_urgency_level` - Urgency level (6.94%)
8. `special_char_count` - Special character count (6.39%)
9. `openai_temptation_level` - Temptation level (6.03%)
10. `contains_link_text` - Contains link text (5.13%)

## 📂 File Structure

```
HackTheSource_Model/
├── training_data.csv          # Training data
├── train_model.py             # Model training script
├── predict.py                 # Prediction script
├── api_server.py              # Flask API service
├── nodejs_example.js          # Node.js integration example
├── requirements.txt           # Python dependencies
├── package.json               # Node.js dependencies
├── scam_detector_model.pkl    # Trained model
├── feature_importance.png     # Feature importance chart
├── model_metrics.json         # Model evaluation metrics
└── feature_columns.json       # Feature column list
```

## ⚠️ Important Notes

1. **Small Dataset**: Currently only 111 training samples. Recommend collecting more samples to improve performance
2. **Class Imbalance**: Scam:Normal = 2.26:1, handled with class_weight
3. **False Positive Rate**: May have higher false positive rate (classifying normal as scam). Adjust threshold for production use
4. **Feature Engineering**: Model performance heavily depends on feature extraction quality

## 🔄 Improvement Suggestions

1. **Increase Training Data**: Collect more normal message samples (target 500-1000)
2. **Adjust Threshold**: Tune classification threshold based on requirements (default 0.5)
3. **Feature Optimization**: Analyze misclassified cases, optimize feature extraction
4. **Regular Retraining**: Retrain model periodically as data accumulates

## 📞 Issue Reporting

For any questions or suggestions, please open an issue for discussion.
