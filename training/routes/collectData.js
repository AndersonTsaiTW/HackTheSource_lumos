import express from 'express';
import { parseMessage } from '../../src/services/parser.js';
import { checkUrlSafety } from '../../src/services/safeBrowsing.js';
import { lookupPhone } from '../../src/services/twilioLookup.js';
import { analyzeWithOpenAI } from '../../src/services/openaiCheck.js';
import { extractFeatures } from '../services/featureExtractor.js';
import { initCSV, appendToCSV, getRowCount } from '../utils/csvWriter.js';

const router = express.Router();

// Initialize CSV on server start
initCSV();

router.post('/collect-training-data', async (req, res) => {
  try {
    const { image_path, ocr_text, label } = req.body;

    if (!ocr_text || label === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: ocr_text, label' 
      });
    }

    console.log(`\n📝 Processing training data: ${image_path || 'unknown'}`);

    // 1. Parse message
    const parsed = parseMessage(ocr_text);

    // 2. Call APIs in parallel
    const [urlResult, phoneResult, aiResult] = await Promise.all([
      parsed.url ? checkUrlSafety(parsed.url) : Promise.resolve(null),
      parsed.phone ? lookupPhone(parsed.phone) : Promise.resolve(null),
      analyzeWithOpenAI(ocr_text),
    ]);

    // 3. Extract all features
    const features = extractFeatures(ocr_text, parsed, urlResult, phoneResult, aiResult);

    // 4. Prepare row data
    const rowData = {
      message_id: getRowCount() + 1,
      label: label,
      source: image_path || 'unknown',
      message_text: ocr_text,
      ...features
    };

    // 5. Append to CSV
    appendToCSV(rowData);

    console.log(`✅ Added row ${rowData.message_id} to training_data.csv`);

    res.json({
      success: true,
      message_id: rowData.message_id,
      features: features,
      apis_called: {
        url: !!urlResult,
        phone: !!phoneResult,
        openai: !!aiResult
      }
    });

  } catch (error) {
    console.error('❌ Error collecting training data:', error);
    res.status(500).json({
      error: 'Failed to collect training data',
      message: error.message
    });
  }
});

// Get CSV statistics
router.get('/training-stats', (req, res) => {
  try {
    const totalRows = getRowCount();
    res.json({
      total_samples: totalRows,
      csv_file: 'training_data.csv'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
