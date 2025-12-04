/**
 * Generate risk assessment and recommendations from analysis results
 */
export function generateResponse({ parsed, urlResult, phoneResult, aiResult, xgboostResult }) {
  const evidence = [];
  let riskLevel = 'green'; // green, yellow, red
  let riskScore = 0;
  let mlScore = 0; // XGBoost ML score

  // XGBoost ML Model Score (if available)
  if (xgboostResult && xgboostResult.available) {
    mlScore = Math.round(xgboostResult.scamProbability * 100);
    evidence.push(`🤖 ML Model: ${mlScore}% scam probability (${xgboostResult.confidence} confidence)`);
    
    // Add top contributing factors if available
    if (xgboostResult.topScamFactors && xgboostResult.topScamFactors.length > 0) {
      evidence.push('   Top factors contributing to scam detection:');
      xgboostResult.topScamFactors.slice(0, 5).forEach((factor, index) => {
        evidence.push(`   ${index + 1}. ${factor.feature}: ${factor.value.toFixed(2)} (importance: ${(factor.importance * 100).toFixed(1)}%)`);
      });
    }
    
    // ML model has the highest weight
    riskScore += mlScore * 0.7; // 70% weight from ML model
  }

  // Analyze URL risk
  if (urlResult) {
    if (!urlResult.isSafe) {
      evidence.push(`⚠️ URL flagged by Google as ${getThreatTypeName(urlResult.threatType)}`);
      riskScore += xgboostResult?.available ? 15 : 40; // Lower weight if ML is available
    } else if (!urlResult.error) {
      evidence.push('✅ URL not flagged as malicious');
    }
  }

  // Analyze phone risk
  if (phoneResult) {
    if (phoneResult.lineType === 'voip') {
      evidence.push('⚠️ Phone is VoIP, commonly used in scams');
      riskScore += xgboostResult?.available ? 10 : 30; // Lower weight if ML is available
    } else if (phoneResult.valid) {
      evidence.push(`✅ Phone number is valid (${phoneResult.carrier || 'Unknown carrier'})`);
    } else {
      evidence.push('⚠️ Phone number is invalid or cannot be verified');
      riskScore += xgboostResult?.available ? 7 : 20; // Lower weight if ML is available
    }
  }

  // Analyze AI determination
  if (aiResult) {
    if (aiResult.isScam) {
      evidence.push(`🔍 AI Analysis: Likely Scam`);
      evidence.push(`   Reason: ${aiResult.reason}`);
      riskScore += xgboostResult?.available ? (aiResult.confidence * 0.3) : (aiResult.confidence * 0.99);
    } else {
      evidence.push(`🔍 AI Analysis: Considered Legitimate`);
    }

    if (aiResult.keywords && aiResult.keywords.length > 0) {
      evidence.push(`   Keywords: ${aiResult.keywords.join(', ')}`);
    }
  }

  // Determine risk level
  if (riskScore >= 60) {
    riskLevel = 'red';
  } else if (riskScore >= 30) {
    riskLevel = 'yellow';
  }

  // Generate action suggestions
  const action = getActionSuggestion(riskLevel, parsed);

  return {
    riskLevel,
    riskScore: Math.min(Math.round(riskScore), 99),
    mlScore: xgboostResult?.available ? mlScore : null, // Add ML score separately
    evidence,
    action,
    parsed: {
      url: parsed.url,
      phone: parsed.phone,
      content: parsed.content.substring(0, 100) + (parsed.content.length > 100 ? '...' : ''),
    },
    details: {
      url: urlResult,
      phone: phoneResult,
      ai: aiResult,
      ml: xgboostResult?.available ? {
        scamProbability: xgboostResult.scamProbability,
        isScam: xgboostResult.isScam,
        confidence: xgboostResult.confidence,
        topScamFactors: xgboostResult.topScamFactors || [],
      } : null,
    },
  };
}

function getThreatTypeName(threatType) {
  const types = {
    'MALWARE': 'Malware',
    'SOCIAL_ENGINEERING': 'Phishing',
    'UNWANTED_SOFTWARE': 'Unwanted Software',
    'POTENTIALLY_HARMFUL_APPLICATION': 'Potentially Harmful Application',
  };
  return types[threatType] || threatType;
}

function getActionSuggestion(riskLevel, parsed) {
  switch (riskLevel) {
    case 'red':
      return {
        title: '🚨 High Risk Warning',
        suggestions: [
          'Do not click any links',
          'Do not call back the phone number',
          'Block this number immediately',
          'Report to 165 anti-fraud hotline',
        ],
      };
    case 'yellow':
      return {
        title: '⚠️ Handle with Caution',
        suggestions: [
          'Verify through official channels first',
          'Do not provide personal information',
          parsed.url ? 'Avoid clicking suspicious links' : null,
          'Call 165 if you have doubts',
        ].filter(Boolean),
      };
    default:
      return {
        title: '✅ Appears Safe',
        suggestions: [
          'No obvious scam features detected',
          'However, remain vigilant',
          'Do not easily provide personal information',
        ],
      };
  }
}
