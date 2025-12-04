# Training Data Collection

Tools for collecting and preparing training data for the XGBoost scam detection model.

## Structure

```
training/
├── routes/          # API routes
├── services/        # Feature extraction
├── utils/           # CSV writing utilities
├── scripts/         # Test and batch processing scripts
└── index.js         # Training server entry point
```

## Usage

### 1. Start the training server

```bash
node training/index.js
```

Server runs on `http://localhost:3001`

### 2. Collect training data

```bash
# Test with sample messages
node training/scripts/test-collect.js
```

### 3. Check output

Training data is saved to `training_data.csv` in the project root.

## API Endpoints

- `POST /api/collect-training-data` - Collect one training sample
  ```json
  {
    "ocr_text": "Message text...",
    "label": 1,
    "image_path": "data_pics/fraud/IMG_001.PNG"
  }
  ```

- `GET /api/training-stats` - Get collection statistics

## Features Extracted

Total: **45 features**

- Text features (14)
- URL features (8)
- Phone features (7)
- OpenAI AI features (12)
- Statistical features (3)

## Output

CSV file with all extracted features, ready for XGBoost training in Python.
