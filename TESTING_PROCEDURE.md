# Integration Test & Cleanup Procedure

## Step 1: Cleanup (Remove incorrect .venv)

**Why?** The outer `.venv` should NOT exist. Only `lumos_XGBoost/.venv` should exist.

```powershell
# Remove outer .venv (if it exists)
cd C:\Users\ander\OneDrive\Documents\GitHub\HackTheSource_Lumos
Remove-Item -Recurse -Force .venv -ErrorAction SilentlyContinue
```

---

## Step 2: Verify Environment Structure

```powershell
# Check current directory structure
Get-ChildItem -Directory | Select-Object Name

# Expected output should NOT show .venv in root
# But should show: lumos_XGBoost, src, training, etc.
```

---

## Step 3: Start Python API Service

**Terminal 1** - Start Python ML API:

```powershell
# Navigate to ML model directory
cd C:\Users\ander\OneDrive\Documents\GitHub\HackTheSource_Lumos\lumos_XGBoost

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Start Python Flask API
python api_server.py
```

**Expected Output:**
```
🚀 Starting API service...
✅ Model loaded successfully
🌐 API Service Started
* Running on http://127.0.0.1:5000
```

**Keep this terminal running!**

---

## Step 4: Test Python API (in another terminal)

**Terminal 2** - Test Python API:

```powershell
# Test health endpoint
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

---

## Step 5: Start Node.js API Service

**Terminal 2** (same terminal, or open Terminal 3):

```powershell
# Navigate back to project root
cd C:\Users\ander\OneDrive\Documents\GitHub\HackTheSource_Lumos

# Start Node.js API
npm run dev
```

**Expected Output:**
```
🚀 Server is running on http://localhost:3000
```

**Keep this terminal running too!**

---

## Step 6: Test Node.js API (Integration Test)

**Terminal 3** - Test the integration:

```powershell
# Test with a scam message
$body = @{
    message = "URGENT! You won $1000! Click http://bit.ly/prize now! Call 0912345678"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/analyze `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Expected Response (should include ML score):**
```json
{
  "riskLevel": "red",
  "riskScore": 85,
  "mlScore": 90,          // <-- ML model is working!
  "evidence": [
    "🤖 ML Model: 90% scam probability (High confidence)",
    "⚠️ URL is shortened link",
    "⚠️ Phone is VoIP",
    ...
  ],
  "action": { ... }
}
```

---

## ✅ Success Indicators

Your integration is working if you see:

1. ✅ **Python API**: `model_loaded: true` in health check
2. ✅ **Node.js API**: Server starts without errors
3. ✅ **Response includes**: `"mlScore": 90` (or any number)
4. ✅ **Evidence includes**: "🤖 ML Model: X% scam probability"
5. ✅ **Console shows**: "🤖 XGBoost prediction: 0.XX"

---

## ❌ Troubleshooting

### Issue 1: Python API not starting

**Check virtual environment:**
```powershell
cd lumos_XGBoost
Test-Path .\.venv\Scripts\python.exe
```

**If False, recreate venv:**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install pandas numpy scikit-learn==1.6.1 xgboost joblib matplotlib seaborn flask flask-cors nltk
```

### Issue 2: Node.js can't connect to Python

**Check if Python API is running:**
```powershell
curl http://localhost:5000/health
```

**Check .env has correct URL:**
```powershell
Get-Content .env | Select-String "XGBOOST"
```

Should show: `XGBOOST_API_URL=http://localhost:5000`

### Issue 3: mlScore is null

**Means**: ML model not available, degraded to rule-based

**Check Node.js console for:**
```
⚠️ XGBoost not available, using rule-based scoring only
```

**Solution**: Ensure Python API is running first

---

## 🚀 Alternative: One-Command Start (After Testing)

Once you confirm everything works, you can use:

```powershell
npm run start:all
```

This starts both services simultaneously using `concurrently`.

---

## 📊 Test Results Checklist

- [ ] Outer `.venv` removed
- [ ] Python API starts successfully
- [ ] Python health check returns `model_loaded: true`
- [ ] Node.js API starts successfully
- [ ] Test request returns response with `mlScore`
- [ ] Evidence includes "🤖 ML Model" message
- [ ] Console shows XGBoost prediction logs

---

## 📝 Notes

- **Python API Port**: 5000
- **Node.js API Port**: 3000
- **Python venv location**: `lumos_XGBoost/.venv` ✅
- **Root .venv**: Should NOT exist ❌
