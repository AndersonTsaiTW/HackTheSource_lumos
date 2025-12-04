# Integration Setup Checklist

## ✅ Completed Setup

- [x] Node.js services created
  - [x] `src/services/xgboostService.js`
  - [x] `src/services/featureExtractor.js`
  - [x] `src/utils/analyzer.js` with hybrid scoring
- [x] Routes updated
  - [x] `src/routes/analyze.js` integrated with ML
- [x] Configuration updated
  - [x] `src/config.js` has xgboostApiUrl
  - [x] `package.json` has concurrently and npm scripts
- [x] Python ML model ready
  - [x] `lumos_XGBoost/api_server.py` exists
  - [x] `lumos_XGBoost/scam_detector_model.pkl` exists
  - [x] `lumos_XGBoost/requirements.txt` exists

## ⚠️ Required Steps to Complete

### 1. Update .env file

Add this line to your `.env`:
```env
XGBOOST_API_URL=http://localhost:5000
```

### 2. Install Python Dependencies

```bash
cd lumos_XGBoost
pip install -r requirements.txt
cd ..
```

### 3. Install concurrently (if not already installed)

```bash
npm install
```

## 🧪 Testing Steps

### 1. Start Both Services

```bash
npm run start:all
```

You should see:
- `🚀 Server is running on http://localhost:3000`
- `🌐 API Service Started` (from Python)

### 2. Test Node.js API

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"URGENT! You won $1000! Click http://bit.ly/prize now! Call 0912345678\"}"
```

### 3. Verify ML Model is Working

Check response should include:
```json
{
  "riskScore": 85,
  "mlScore": 90,  // <-- This indicates ML model is working
  "riskLevel": "red",
  "evidence": [
    "🤖 ML Model: 90% scam probability (High confidence)",  // <-- ML evidence
    ...
  ]
}
```

If `mlScore` is `null`, the ML model is not available (degraded to rule-based).

### 4. Test Python API Directly (Optional)

```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

## 🔍 Troubleshooting

### ML Model Not Being Used

**Check console logs for:**
- `⚠️ XGBoost not available, using rule-based scoring only`

**Solutions:**
1. Ensure Python service is running (`npm run ml:start`)
2. Check `XGBOOST_API_URL` in `.env`
3. Verify Python dependencies installed

### Python Service Won't Start

**Error**: `ModuleNotFoundError`

**Solution**: Install Python packages
```bash
cd lumos_XGBoost
pip install -r requirements.txt
```

**Error**: `Model not loaded`

**Solution**: Train the model
```bash
cd lumos_XGBoost
python train_model.py
```

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**: 
1. Kill process using port 5000
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -i :5000
   kill -9 <PID>
   ```
2. Or change port in `lumos_XGBoost/api_server.py`

## ✨ Success Indicators

You'll know the integration is working when:

1. ✅ Both services start without errors
2. ✅ Response includes `mlScore` field
3. ✅ Evidence includes "🤖 ML Model: X% scam probability"
4. ✅ Console shows "🤖 XGBoost prediction: 0.XX"
5. ✅ Health check returns `model_loaded: true`

## 📚 Next Steps

After verifying integration works:

1. **Development**: Use `npm run start:all`
2. **Production**: See deployment guide in XGBOOST_INTEGRATION.md
3. **Separation**: See INTEGRATION_GUIDE.md for microservice separation
