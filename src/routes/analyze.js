import express from 'express';
import multer from 'multer';
import { parseMessage } from '../services/parser.js';
import { checkUrlSafety } from '../services/safeBrowsing.js';
import { lookupPhone } from '../services/twilioLookup.js';
import { analyzeWithOpenAI } from '../services/openaiCheck.js';
import { generateResponse } from '../utils/analyzer.js';
import { extractTextFromImage } from '../services/ocrService.js';
import { predictScamProbability } from '../services/xgboostService.js';
import { extractFeaturesForML } from '../services/featureExtractor.js';

const router = express.Router();

// Configure Multer for OCR endpoint
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

router.post('/analyze', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // 1. Parse message to extract URL, phone, and content
    const parsed = parseMessage(message);
    console.log('📝 Parsed result:', parsed);

    // 2. Call three APIs in parallel
    const [urlResult, phoneResult, aiResult] = await Promise.all([
      parsed.url ? checkUrlSafety(parsed.url) : Promise.resolve(null),
      parsed.phone ? lookupPhone(parsed.phone) : Promise.resolve(null),
      analyzeWithOpenAI(parsed.content),
    ]);

    // 3. Extract 45 features for ML model
    const features = extractFeaturesForML(message, parsed, urlResult, phoneResult, aiResult);
    console.log('🔢 Extracted features for ML model');

    // 4. Call XGBoost ML model for prediction (with fallback)
    const xgboostResult = await predictScamProbability(features);
    if (xgboostResult.available) {
      console.log('🤖 XGBoost prediction:', xgboostResult.scamProbability);
    } else {
      console.log('⚠️ XGBoost not available, using rule-based scoring only');
    }

    // 5. Generate comprehensive response (hybrid scoring)
    const response = generateResponse({
      parsed,
      urlResult,
      phoneResult,
      aiResult,
      xgboostResult,
    });

    res.json(response);
  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message 
    });
  }
});

// OCR endpoint: Extract text from image and analyze for scams
router.post('/ocr', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    console.log('📸 Received image:', req.file.originalname, `(${req.file.size} bytes)`);

    // 1. Extract text from image using OCR
    const extractedText = await extractTextFromImage(req.file.buffer);

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ error: 'No text could be extracted from the image' });
    }

    console.log('📄 Text extracted:', extractedText.substring(0, 100) + '...');

    // 2. Parse extracted text to find URLs and phone numbers
    const parsed = parseMessage(extractedText);

    // 3. Call analysis APIs in parallel
    const [urlResult, phoneResult, aiResult] = await Promise.all([
      parsed.url ? checkUrlSafety(parsed.url) : Promise.resolve(null),
      parsed.phone ? lookupPhone(parsed.phone) : Promise.resolve(null),
      analyzeWithOpenAI(parsed.content),
    ]);

    // 4. Extract features for ML model
    const features = extractFeaturesForML(extractedText, parsed, urlResult, phoneResult, aiResult);

    // 5. Call XGBoost ML model
    const xgboostResult = await predictScamProbability(features);

    // 6. Generate response with OCR results
    const analysisResult = generateResponse({
      parsed,
      urlResult,
      phoneResult,
      aiResult,
      xgboostResult,
    });

    res.json({
      text: extractedText,
      riskScore: analysisResult.riskScore,
      riskLevel: analysisResult.riskLevel,
      mlScore: analysisResult.mlScore,
      evidence: analysisResult.evidence,
      action: analysisResult.action,
    });
  } catch (error) {
    console.error('❌ OCR analysis error:', error);
    res.status(500).json({ 
      error: 'OCR analysis failed', 
      message: error.message 
    });
  }
});

export default router;
