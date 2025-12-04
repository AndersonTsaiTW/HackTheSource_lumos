/**
 * Extract 45 features from message for XGBoost model
 * Reuses existing analysis results (parsed, urlResult, phoneResult, aiResult)
 */

/**
 * Extract all 45 features for XGBoost model
 */
export function extractFeaturesForML(text, parsed, urlResult, phoneResult, aiResult) {
  const features = {
    // Text features (14)
    char_count: text.length,
    word_count: text.split(/\s+/).filter(w => w.length > 0).length,
    digit_count: (text.match(/\d/g) || []).length,
    digit_ratio: calculateDigitRatio(text),
    uppercase_ratio: calculateUppercaseRatio(text),
    special_char_count: (text.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length,
    exclamation_count: (text.match(/!/g) || []).length,
    question_count: (text.match(/\?/g) || []).length,
    has_urgent_keywords: hasUrgentKeywords(text) ? 1 : 0,
    suspicious_word_count: countSuspiciousWords(text),
    max_word_length: getMaxWordLength(text),
    avg_word_length: parseFloat(calculateAvgWordLength(text)),
    emoji_count: (text.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu) || []).length,
    consecutive_caps: getConsecutiveCaps(text),

    // URL features (8)
    url_count: parsed.url ? 1 : 0,
    has_suspicious_tld: parsed.url ? hasSuspiciousTLD(parsed.url) : 0,
    has_ip_address: parsed.url ? hasIPAddress(parsed.url) : 0,
    has_url_shortener: parsed.url ? isShortUrl(parsed.url) : 0,
    avg_url_length: parsed.url ? parsed.url.length : 0,
    has_https: parsed.url ? (parsed.url.startsWith('https') ? 1 : 0) : 0,
    url_path_depth: parsed.url ? getUrlPathDepth(parsed.url) : 0,
    subdomain_count: parsed.url ? getSubdomainCount(parsed.url) : 0,

    // Phone features (7)
    phone_count: parsed.phone ? 1 : 0,
    has_intl_code: parsed.phone ? (parsed.phone.startsWith('+') ? 1 : 0) : 0,
    is_voip: phoneResult?.lineType === 'voip' ? 1 : 0,
    is_mobile: phoneResult?.lineType === 'mobile' ? 1 : 0,
    is_valid_phone: phoneResult?.valid ? 1 : 0,
    phone_carrier_known: phoneResult?.carrier ? 1 : 0,
    has_multiple_phones: (text.match(/\d{3,4}[-\s]?\d{3,4}[-\s]?\d{4}/g) || []).length > 1 ? 1 : 0,

    // AI features (12)
    urgency_level: aiResult?.urgency_level || 0,
    threat_level: aiResult?.threat_level || 0,
    temptation_level: aiResult?.temptation_level || 0,
    impersonation_type: aiResult?.impersonation_type || 'none',
    action_requested: aiResult?.action_requested || 'none',
    grammar_quality: aiResult?.grammar_quality || 5,
    emotion_triggers: aiResult?.emotion_triggers ? aiResult.emotion_triggers.join(',') : 'none',
    credibility_score: aiResult?.credibility_score || 5,
    ai_is_scam: aiResult?.isScam ? 1 : 0,
    ai_confidence: aiResult?.confidence || 0,
    has_scam_keywords: aiResult?.keywords && aiResult.keywords.length > 0 ? 1 : 0,
    keyword_count: aiResult?.keywords ? aiResult.keywords.length : 0,

    // Statistical features (3)
    text_entropy: calculateEntropy(text),
    readability_score: calculateReadabilityScore(text),
    sentence_complexity: calculateSentenceComplexity(text),

    // URL safety (1 - from Google Safe Browsing)
    google_safe_browsing_flagged: urlResult && !urlResult.isSafe ? 1 : 0,
  };

  return features;
}

// Helper functions
function calculateDigitRatio(text) {
  if (text.length === 0) return 0;
  const digitCount = (text.match(/\d/g) || []).length;
  return parseFloat((digitCount / text.length).toFixed(3));
}

function calculateUppercaseRatio(text) {
  const letters = text.match(/[a-zA-Z]/g) || [];
  if (letters.length === 0) return 0;
  const uppercaseCount = (text.match(/[A-Z]/g) || []).length;
  return parseFloat((uppercaseCount / letters.length).toFixed(3));
}

function hasUrgentKeywords(text) {
  const urgentWords = ['urgent', 'immediate', 'now', 'asap', 'hurry', 'fast', 'quick', 'alert', 'warning', 'action required', '緊急', '立即', '馬上', '盡快'];
  const lowerText = text.toLowerCase();
  return urgentWords.some(w => lowerText.includes(w.toLowerCase()));
}

function countSuspiciousWords(text) {
  const suspiciousWords = ['prize', 'winner', 'congratulations', 'claim', 'verify', 'suspended', 'locked', 'confirm', 'password', 'account', 'bank', 'credit card', '中獎', '恭喜', '領取', '驗證', '帳號', '密碼'];
  const lowerText = text.toLowerCase();
  return suspiciousWords.filter(w => lowerText.includes(w.toLowerCase())).length;
}

function getMaxWordLength(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 0;
  return Math.max(...words.map(w => w.length));
}

function calculateAvgWordLength(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 0;
  const totalLength = words.reduce((sum, word) => sum + word.length, 0);
  return (totalLength / words.length).toFixed(2);
}

function getConsecutiveCaps(text) {
  const matches = text.match(/[A-Z]{3,}/g);
  return matches ? matches.length : 0;
}

function hasSuspiciousTLD(url) {
  const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.work', '.click'];
  try {
    const hostname = new URL(url).hostname;
    return suspiciousTLDs.some(tld => hostname.endsWith(tld)) ? 1 : 0;
  } catch {
    return 0;
  }
}

function hasIPAddress(url) {
  const ipPattern = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
  return ipPattern.test(url) ? 1 : 0;
}

function isShortUrl(url) {
  const shortDomains = ['bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 'reurl.cc', 't.co', 'short.link', 'tiny.cc'];
  try {
    const hostname = new URL(url).hostname;
    return shortDomains.some(d => hostname.includes(d)) ? 1 : 0;
  } catch {
    return 0;
  }
}

function getUrlPathDepth(url) {
  try {
    const path = new URL(url).pathname;
    return path.split('/').filter(p => p.length > 0).length;
  } catch {
    return 0;
  }
}

function getSubdomainCount(url) {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split('.');
    return Math.max(0, parts.length - 2); // Exclude domain and TLD
  } catch {
    return 0;
  }
}

function calculateEntropy(text) {
  if (text.length === 0) return 0;
  const freq = {};
  for (let char of text) {
    freq[char] = (freq[char] || 0) + 1;
  }
  let entropy = 0;
  for (let char in freq) {
    const p = freq[char] / text.length;
    entropy -= p * Math.log2(p);
  }
  return parseFloat(entropy.toFixed(3));
}

function calculateReadabilityScore(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (words.length === 0 || sentences.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  
  // Simple readability score (lower is easier to read)
  const score = (avgWordsPerSentence * 0.5) + (avgWordLength * 2);
  return parseFloat(Math.min(score, 100).toFixed(2));
}

function calculateSentenceComplexity(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  
  let complexCount = 0;
  for (let sentence of sentences) {
    const words = sentence.split(/\s+/).filter(w => w.length > 0);
    const hasLongWords = words.some(w => w.length > 10);
    const hasMultipleClauses = (sentence.match(/[,;]/g) || []).length > 2;
    
    if (hasLongWords || hasMultipleClauses) {
      complexCount++;
    }
  }
  
  return parseFloat((complexCount / sentences.length).toFixed(2));
}
