// API Test Script
// Make sure the server is running first: npm run dev

const API_URL = 'http://localhost:3000/api/analyze';

const testCases = [
  {
    name: 'Suspicious package scam',
    message: 'URGENT! Your package has arrived. Click http://bit.ly/pakage123 to claim it. Contact: 0987654321'
  },
  {
    name: 'Bank phishing attempt',
    message: 'Your bank account has been locked. Please visit https://secure-bank-verify.com immediately. Call 0912345678'
  },
  {
    name: 'Legitimate message',
    message: 'Hi! Thanks for your order. It will arrive tomorrow. Contact us at 02-2345-6789 if you have questions.'
  },
  {
    name: 'Prize scam',
    message: 'Congratulations! You won $10,000! Claim at http://winner-prize.net or call 0999888777 now!'
  }
];

async function testAPI(testCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Test: ${testCase.name}`);
  console.log(`📝 Message: "${testCase.message}"`);
  console.log('-'.repeat(60));

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: testCase.message })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`\n🎯 Risk Level: ${data.riskLevel.toUpperCase()}`);
    console.log(`📊 Risk Score: ${data.riskScore}/100`);
    
    console.log(`\n📋 Evidence:`);
    data.evidence.forEach(item => console.log(`   ${item}`));
    
    console.log(`\n💡 ${data.action.title}`);
    console.log(`   Suggestions:`);
    data.action.suggestions.forEach(item => console.log(`   • ${item}`));

    console.log(`\n✅ Test passed!`);
    return true;

  } catch (error) {
    console.log(`\n❌ Test failed!`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting API Tests...');
  console.log(`Target: ${API_URL}\n`);

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const result = await testAPI(testCase);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📈 Test Summary:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total: ${testCases.length}`);
  console.log(`${'='.repeat(60)}\n`);

  if (failed > 0) {
    console.log('⚠️  Make sure the server is running: npm run dev');
  }
}

// Run tests
runAllTests();
