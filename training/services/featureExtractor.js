/**
 * Extract features from message text for ML training
 */
export function extractFeatures(text, parsed, urlResult, phoneResult, aiResult) {
  // Text features
  const urgentWords = ['urgent', 'immediate', 'now', 'asap', 'hurry', 'fast', 'quick', 'alert', 'warning', 'action required'];
  const moneyWords = ['money', 'prize', 'win', 'won', 'cash', 'reward', 'bonus', 'free', 'gift', 'claim', 'dollar', 'payment'];
  const linkWords = ['click', 'link', 'visit', 'url', 'website', 'site', 'open', 'access'];
  const prizeWords = ['congratulations', 'winner', 'selected', 'lucky', 'chosen', 'qualified'];
  const bankWords = ['bank', 'account', 'password', 'verify', 'confirm', 'secure', 'credential', 'login'];
  const packageWords = ['package', 'delivery', 'parcel', 'shipment', 'courier', 'shipping', 'tracking'];

  const lowerText = text.toLowerCase();
  
  const features = {
    // Text features
    message_length: text.length,
    contains_urgent_words: urgentWords.some(w => lowerText.includes(w.toLowerCase())) ? 1 : 0,
    contains_money_keywords: moneyWords.some(w => lowerText.includes(w.toLowerCase())) ? 1 : 0,
    contains_link_text: linkWords.some(w => lowerText.includes(w.toLowerCase())) ? 1 : 0,
    contains_prize_keywords: prizeWords.some(w => lowerText.includes(w.toLowerCase())) ? 1 : 0,
    contains_bank_keywords: bankWords.some(w => lowerText.includes(w.toLowerCase())) ? 1 : 0,
    contains_package_keywords: packageWords.some(w => lowerText.includes(w.toLowerCase())) ? 1 : 0,
    special_char_count: (text.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length,
    exclamation_count: (text.match(/!/g) || []).length,
    question_count: (text.match(/\?/g) || []).length,
    
    // URL features
    has_url: parsed.url ? 1 : 0,
    url_count: parsed.url ? 1 : 0,
    url_domain: parsed.url ? new URL(parsed.url).hostname : null,
    url_is_shortened: parsed.url ? isShortUrl(parsed.url) : 0,
    url_has_ip: parsed.url ? hasIPAddress(parsed.url) : 0,
    url_length: parsed.url ? parsed.url.length : 0,
    google_safe_browsing_is_safe: urlResult?.response?.matches ? 0 : 1,
    google_safe_browsing_threat: urlResult?.response?.matches?.[0]?.threatType || null,
    
    // Phone features
    has_phone: parsed.phone ? 1 : 0,
    phone_count: parsed.phone ? 1 : 0,
    phone_number: parsed.phone,
    phone_is_mobile: phoneResult?.line_type_intelligence?.type === 'mobile' ? 1 : 0,
    phone_is_voip: phoneResult?.line_type_intelligence?.type === 'voip' ? 1 : 0,
    phone_is_valid: phoneResult?.valid ? 1 : 0,
    phone_carrier: phoneResult?.line_type_intelligence?.carrier_name || null,
    phone_country_code: phoneResult?.country_code || null,
    
    // OpenAI features
    openai_is_scam: aiResult?.isScam ? 1 : 0,
    openai_confidence: aiResult?.confidence || 0,
    openai_reason: aiResult?.reason || null,
    openai_keywords: aiResult?.keywords ? aiResult.keywords.join(', ') : null,
    openai_urgency_level: aiResult?.urgency_level || 0,
    openai_threat_level: aiResult?.threat_level || 0,
    openai_temptation_level: aiResult?.temptation_level || 0,
    openai_impersonation_type: aiResult?.impersonation_type || null,
    openai_action_requested: aiResult?.action_requested || null,
    openai_grammar_quality: aiResult?.grammar_quality || 0,
    openai_emotion_triggers: aiResult?.emotion_triggers ? aiResult.emotion_triggers.join(', ') : null,
    openai_credibility_score: aiResult?.credibility_score || 0,
    
    // Statistical features
    avg_word_length: calculateAvgWordLength(text),
    digit_ratio: calculateDigitRatio(text),
    uppercase_ratio: calculateUppercaseRatio(text),
  };
  
  return features;
}

function isShortUrl(url) {
  const shortDomains = ['bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 'reurl.cc', 't.co', 'short.link'];
  try {
    const hostname = new URL(url).hostname;
    return shortDomains.some(d => hostname.includes(d)) ? 1 : 0;
  } catch {
    return 0;
  }
}

function hasIPAddress(url) {
  const ipPattern = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
  return ipPattern.test(url) ? 1 : 0;
}

function calculateAvgWordLength(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 0;
  const totalLength = words.reduce((sum, word) => sum + word.length, 0);
  return (totalLength / words.length).toFixed(2);
}

function calculateDigitRatio(text) {
  if (text.length === 0) return 0;
  const digitCount = (text.match(/\d/g) || []).length;
  return (digitCount / text.length).toFixed(3);
}

function calculateUppercaseRatio(text) {
  const letters = text.match(/[a-zA-Z]/g) || [];
  if (letters.length === 0) return 0;
  const uppercaseCount = (text.match(/[A-Z]/g) || []).length;
  return (uppercaseCount / letters.length).toFixed(3);
}
