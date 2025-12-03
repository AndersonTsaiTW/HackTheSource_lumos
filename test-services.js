// Test individual service APIs
import dotenv from 'dotenv';
import { parseMessage } from './src/services/parser.js';
import { checkUrlSafety } from './src/services/safeBrowsing.js';
import { lookupPhone } from './src/services/twilioLookup.js';
import { analyzeWithOpenAI } from './src/services/openaiCheck.js';

dotenv.config();

console.log('\n🧪 Testing Individual APIs\n');
console.log('='.repeat(70));

// Test data
const testMessage = 'URGENT! Package waiting. Visit http://suspicious-site.com or call 0912345678';
const parsed = parseMessage(testMessage);

const testMalwareUrl = 'http://testsafebrowsing.appspot.com/s/malware.html';
const testMalwarePhone = '+44 7799 829460';

console.log('\n📝 Parsed Message:');
console.log('   URL:', parsed.url || 'None');
console.log('   Phone:', parsed.phone || 'None');
console.log('   Content:', parsed.content.substring(0, 50) + '...');

// Test 1: Google Safe Browsing
console.log('\n' + '='.repeat(70));
console.log('🔍 Test 1: Google Safe Browsing API');
console.log('-'.repeat(70));
if (parsed.url) {
  try {
    const result = await checkUrlSafety(parsed.url);
    console.log('✅ Result:', JSON.stringify(result, null, 2));
    const resultMal = await checkUrlSafety(testMalwareUrl);
    console.log('✅ Result:', JSON.stringify(resultMal, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
} else {
  console.log('⚠️  No URL found in message');
}

// Test 2: Twilio Lookup
console.log('\n' + '='.repeat(70));
console.log('📞 Test 2: Twilio Lookup API');
console.log('-'.repeat(70));
if (parsed.phone) {
  try {
    const result = await lookupPhone(parsed.phone);
    console.log('✅ Result:', JSON.stringify(result, null, 2));
    const resultMel = await lookupPhone(testMalwarePhone);
    console.log('✅ Result:', JSON.stringify(resultMel, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
} else {
  console.log('⚠️  No phone number found in message');
}

/*
// Test 3: OpenAI
console.log('\n' + '='.repeat(70));
console.log('🤖 Test 3: OpenAI Scam Detection API');
console.log('-'.repeat(70));
try {
  const result = await analyzeWithOpenAI(parsed.content);
  console.log('✅ Result:', JSON.stringify(result, null, 2));
} catch (error) {
  console.log('❌ Error:', error.message);
}
*/
console.log('\n' + '='.repeat(70));
console.log('✨ All tests completed!\n');
