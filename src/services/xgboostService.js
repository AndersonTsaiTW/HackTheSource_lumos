/**
 * XGBoost Model Service
 * Call Python Flask API for scam probability prediction
 */
import axios from 'axios';

const XGBOOST_API_URL = process.env.XGBOOST_API_URL || 'http://localhost:5000';

/**
 * Check if XGBoost API is available
 */
export async function checkXGBoostHealth() {
  try {
    const response = await axios.get(`${XGBOOST_API_URL}/health`, {
      timeout: 2000,
    });
    return response.data.model_loaded === true;
  } catch (error) {
    console.warn('⚠️ XGBoost API not available:', error.message);
    return false;
  }
}

/**
 * Predict scam probability using XGBoost model
 * @param {Object} features - 45 features extracted from message
 * @returns {Object} Prediction result with scam_probability
 */
export async function predictScamProbability(features) {
  try {
    const response = await axios.post(
      `${XGBOOST_API_URL}/predict`,
      features,
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      return {
        available: true,
        scamProbability: response.data.result.scam_probability,
        isScam: response.data.result.is_scam,
        confidence: response.data.result.confidence,
        normalProbability: response.data.result.normal_probability,
      };
    } else {
      throw new Error(response.data.error || 'Prediction failed');
    }
  } catch (error) {
    console.error('❌ XGBoost prediction error:', error.message);
    return {
      available: false,
      error: error.message,
    };
  }
}

/**
 * Get model information
 */
export async function getModelInfo() {
  try {
    const response = await axios.get(`${XGBOOST_API_URL}/model/info`, {
      timeout: 3000,
    });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get model info:', error.message);
    return null;
  }
}
