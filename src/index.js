import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import analyzeRouter from './routes/analyze.js';
import collectDataRouter from '../training/routes/collectData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Only accept image files
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from project root
app.use(express.static(path.join(__dirname, '..')));

// Make upload middleware available globally
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// Serve test.html at root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'test.html'));
});

// Routes
app.use('/api', analyzeRouter);
app.use('/api/training', collectDataRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    endpoints: {
      production: [
        'POST /api/analyze - Analyze message for scam detection'
      ],
      training: [
        'POST /api/training/collect-training-data - Collect training data',
        'GET /api/training/training-stats - Get training statistics'
      ]
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
