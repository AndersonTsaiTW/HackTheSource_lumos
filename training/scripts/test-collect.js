// Test the training data collection endpoint

const API_URL = 'http://localhost:3000/api/training/collect-training-data';

// Test with a few sample messages
const testSamples = [
  {
    image_path: 'data_pics/fraud/IMG_2417.PNG',
    ocr_text: 'Congratulations! You won a prize! Click http://bit.ly/prize123 to claim NOW or call 0912345678',
    label: 1  // fraud
  },
  {
    image_path: 'data_pics/normal/normal_001.PNG',
    ocr_text: 'Hello, your order has been shipped. Contact customer service at 02-2345-6789 for tracking',
    label: 0  // normal
  },
  {
    image_path: 'data_pics/fraud/IMG_2419.PNG',
    ocr_text: 'URGENT! Your package is waiting. Click http://suspicious-link.com NOW! Call 0987654321',
    label: 1  // fraud
  }
];

async function testCollectData() {
  console.log('🚀 Testing Training Data Collection API\n');
  console.log('='.repeat(70));

  for (const sample of testSamples) {
    console.log(`\n📝 Processing: ${sample.image_path}`);
    console.log(`   Label: ${sample.label} (${sample.label === 1 ? 'FRAUD' : 'NORMAL'})`);
    console.log(`   Text: ${sample.ocr_text.substring(0, 50)}...`);
    console.log('-'.repeat(70));

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sample)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`✅ Success! Message ID: ${data.message_id}`);
      console.log(`   APIs Called:`, data.apis_called);
      console.log(`\n   📊 Key Features:`);
      console.log(`      Text Features:`);
      console.log(`        - Message Length: ${data.features.message_length}`);
      console.log(`        - Has URL: ${data.features.has_url}`);
      console.log(`        - Has Phone: ${data.features.has_phone}`);
      console.log(`        - Urgent Words: ${data.features.contains_urgent_words}`);
      console.log(`        - Money Keywords: ${data.features.contains_money_keywords}`);
      console.log(`\n      AI Analysis:`);
      console.log(`        - Is Scam: ${data.features.openai_is_scam} (${data.features.openai_confidence}%)`);
      console.log(`        - Urgency Level: ${data.features.openai_urgency_level}/10`);
      console.log(`        - Threat Level: ${data.features.openai_threat_level}/10`);
      console.log(`        - Temptation Level: ${data.features.openai_temptation_level}/10`);
      console.log(`        - Impersonation: ${data.features.openai_impersonation_type || 'none'}`);
      console.log(`        - Action Requested: ${data.features.openai_action_requested || 'none'}`);
      console.log(`        - Grammar Quality: ${data.features.openai_grammar_quality}/10`);
      console.log(`        - Emotion Triggers: ${data.features.openai_emotion_triggers || 'none'}`);
      console.log(`        - Credibility Score: ${data.features.openai_credibility_score}/10`);

    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }

    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Get statistics
  console.log('\n' + '='.repeat(70));
  console.log('📊 Getting Statistics...\n');
  
  try {
    const statsResponse = await fetch('http://localhost:3000/api/training/training-stats');
    const stats = await statsResponse.json();
    console.log(`✅ Total samples collected: ${stats.total_samples}`);
    console.log(`📁 CSV file: ${stats.csv_file}`);
  } catch (error) {
    console.log(`❌ Failed to get stats: ${error.message}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('✨ Test completed! Check training_data.csv in project root.\n');
}

testCollectData();
