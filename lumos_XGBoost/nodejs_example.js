// Node.js Integration Example
// Demonstrates how to call Python API service from Node.js

const axios = require('axios');

// API service address
const API_URL = 'http://localhost:5000';

/**
 * Detect if a single message is scam
 * @param {Object} messageFeatures - Message features
 * @returns {Promise<Object>} Prediction result
 */
async function detectScam(messageFeatures) {
  try {
    const response = await axios.post(`${API_URL}/predict`, messageFeatures);
    return response.data;
  } catch (error) {
    console.error('Prediction failed:', error.message);
    throw error;
  }
}

/**
 * Batch predict multiple messages
 * @param {Array<Object>} messages - Array of message features
 * @returns {Promise<Object>} Batch prediction result
 */
async function detectScamBatch(messages) {
  try {
    const response = await axios.post(`${API_URL}/predict/batch`, {
      messages: messages
    });
    return response.data;
  } catch (error) {
    console.error('Batch prediction failed:', error.message);
    throw error;
  }
}

/**
 * Check API service health status
 * @returns {Promise<Object>} Health status
 */
async function checkHealth() {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error.message);
    throw error;
  }
}

/**
 * Get model information
 * @returns {Promise<Object>} Model information
 */
async function getModelInfo() {
  try {
    const response = await axios.get(`${API_URL}/model/info`);
    return response.data;
  } catch (error) {
    console.error('Failed to get model info:', error.message);
    throw error;
  }
}

// ========== Usage Examples ==========

async function main() {
  console.log('='.repeat(60));
  console.log('🔍 Node.js Scam SMS Detection Example');
  console.log('='.repeat(60));

  try {
    // 1. Check service health status
    console.log('\n1️⃣ Checking service status...');
    const health = await checkHealth();
    console.log('   Service status:', health);

    // 2. Get model information
    console.log('\n2️⃣ Getting model information...');
    const modelInfo = await getModelInfo();
    console.log('   Feature count:', modelInfo.info.feature_count);

    // 3. Single message prediction - Suspected scam (with text features)
    console.log('\n3️⃣ Testing scam message detection...');
    const scamMessage = {
      // Text features
      message_text: '【緊急通知】您的包裹因地址不詳無法配送,請立即點擊 http://bit.ly/pkg123 補填資料並支付運費99元,逾期將退回!',
      openai_keywords: '緊急,包裹,點擊,支付,運費',
      openai_reason: '要求點擊可疑連結並支付金錢,使用緊急語氣施壓',
      openai_emotion_triggers: '緊急,逾期,退回',
      openai_action_requested: 'click_link',
      openai_impersonation_type: 'courier',
      
      // Numeric features
      message_length: 68,
      contains_urgent_words: 1,
      contains_money_keywords: 1,
      contains_link_text: 1,
      has_url: 1,
      url_is_shortened: 1,
      special_char_count: 15,
      exclamation_count: 1,
      openai_is_scam: 1,
      openai_confidence: 95,
      openai_urgency_level: 9,
      openai_threat_level: 7,
      openai_credibility_score: 2,
      avg_word_length: 4.5,
      digit_ratio: 0.1,
      uppercase_ratio: 0.05,
      contains_phone: 0,
      phone_count: 0,
      has_email: 0,
      number_sequence_count: 1,
      contains_time_sensitive: 1,
      question_mark_count: 0,
      capitalized_word_count: 0,
      word_count: 30,
      unique_word_ratio: 0.8,
      punctuation_ratio: 0.1,
      contains_please: 0,
      contains_verify: 0,
      contains_account: 0,
      contains_prize: 0,
      contains_act_now: 0
    };

    const scamResult = await detectScam(scamMessage);
    console.log('   Prediction:', scamResult.result.prediction_label);
    console.log('   Scam probability:', (scamResult.result.scam_probability * 100).toFixed(2) + '%');
    console.log('   Confidence level:', scamResult.result.confidence);
    
    // Display top scam factors
    if (scamResult.result.top_scam_factors && scamResult.result.top_scam_factors.length > 0) {
      console.log('   Top 5 scam factors:');
      scamResult.result.top_scam_factors.forEach((factor, idx) => {
        console.log(`     ${idx + 1}. ${factor.feature}: ${factor.value.toFixed(4)} (importance: ${factor.importance.toFixed(4)})`);
      });
    }

    // 4. Single message prediction - Normal message (with text features)
    console.log('\n4️⃣ Testing normal message detection...');
    const normalMessage = {
      // Text features
      message_text: '您好,這是來自銀行的通知:您的信用卡帳單已產生,本期應繳金額3500元,繳款期限為本月25日。',
      openai_keywords: '銀行,信用卡,帳單,繳款',
      openai_reason: '正常的銀行帳單通知,無要求立即行動或點擊連結',
      openai_emotion_triggers: '',
      openai_action_requested: 'reply',
      openai_impersonation_type: 'bank',
      
      // Numeric features
      message_length: 45,
      contains_urgent_words: 0,
      contains_money_keywords: 1,
      contains_link_text: 0,
      has_url: 0,
      url_is_shortened: 0,
      special_char_count: 5,
      exclamation_count: 0,
      openai_is_scam: 0,
      openai_confidence: 85,
      openai_urgency_level: 2,
      openai_threat_level: 0,
      openai_credibility_score: 8,
      avg_word_length: 4.2,
      digit_ratio: 0.08,
      uppercase_ratio: 0.0,
      contains_phone: 0,
      phone_count: 0,
      has_email: 0,
      number_sequence_count: 2,
      contains_time_sensitive: 1,
      question_mark_count: 0,
      capitalized_word_count: 0,
      word_count: 25,
      unique_word_ratio: 0.9,
      punctuation_ratio: 0.05,
      contains_please: 0,
      contains_verify: 0,
      contains_account: 0,
      contains_prize: 0,
      contains_act_now: 0
    };

    const normalResult = await detectScam(normalMessage);
    console.log('   Prediction:', normalResult.result.prediction_label);
    console.log('   Scam probability:', (normalResult.result.scam_probability * 100).toFixed(2) + '%');
    console.log('   Confidence level:', normalResult.result.confidence);
    
    // Display top factors
    if (normalResult.result.top_scam_factors && normalResult.result.top_scam_factors.length > 0) {
      console.log('   Top 5 factors:');
      normalResult.result.top_scam_factors.forEach((factor, idx) => {
        console.log(`     ${idx + 1}. ${factor.feature}: ${factor.value.toFixed(4)} (importance: ${factor.importance.toFixed(4)})`);
      });
    }

    // 5. Batch prediction
    console.log('\n5️⃣ Testing batch prediction...');
    const batchResult = await detectScamBatch([scamMessage, normalMessage]);
    console.log('   Prediction count:', batchResult.count);
    batchResult.results.forEach((result, index) => {
      console.log(`   Message ${index + 1}: ${result.prediction_label} (${(result.scam_probability * 100).toFixed(2)}%)`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test Complete');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Tip: Please start Python API service first');
      console.log('   Run: python api_server.py');
    }
  }
}

// Execute example
if (require.main === module) {
  main();
}

// Export functions for use by other modules
module.exports = {
  detectScam,
  detectScamBatch,
  checkHealth,
  getModelInfo
};
