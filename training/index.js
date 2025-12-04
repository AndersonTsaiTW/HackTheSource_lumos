import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import collectDataRouter from './routes/collectData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', collectDataRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Training data collection server is running',
    endpoints: [
      'POST /api/collect-training-data',
      'GET /api/training-stats'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🎓 Training server is running on http://localhost:${PORT}`);
  console.log(`📊 CSV output: training_data.csv`);
});
