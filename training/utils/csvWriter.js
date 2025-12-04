import fs from 'fs';
import path from 'path';

const CSV_FILE = path.join(process.cwd(), 'training_data.csv');

// CSV column headers
const HEADERS = [
  'message_id',
  'label',
  'source',
  'message_text',
  'message_length',
  'contains_urgent_words',
  'contains_money_keywords',
  'contains_link_text',
  'contains_prize_keywords',
  'contains_bank_keywords',
  'contains_package_keywords',
  'special_char_count',
  'exclamation_count',
  'question_count',
  'has_url',
  'url_count',
  'url_domain',
  'url_is_shortened',
  'url_has_ip',
  'url_length',
  'google_safe_browsing_is_safe',
  'google_safe_browsing_threat',
  'has_phone',
  'phone_count',
  'phone_number',
  'phone_is_mobile',
  'phone_is_voip',
  'phone_is_valid',
  'phone_carrier',
  'phone_country_code',
  'openai_is_scam',
  'openai_confidence',
  'openai_reason',
  'openai_keywords',
  'openai_urgency_level',
  'openai_threat_level',
  'openai_temptation_level',
  'openai_impersonation_type',
  'openai_action_requested',
  'openai_grammar_quality',
  'openai_emotion_triggers',
  'openai_credibility_score',
  'avg_word_length',
  'digit_ratio',
  'uppercase_ratio'
];

/**
 * Initialize CSV file with headers if it doesn't exist
 */
export function initCSV() {
  if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(CSV_FILE, HEADERS.join(',') + '\n', 'utf8');
    console.log('✅ Created training_data.csv');
  }
}

/**
 * Append a row to the CSV file
 */
export function appendToCSV(data) {
  const row = HEADERS.map(header => {
    let value = data[header];
    
    // Handle null/undefined
    if (value === null || value === undefined) {
      return '';
    }
    
    // Escape strings containing commas or quotes
    if (typeof value === 'string') {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
    }
    
    return value;
  }).join(',');
  
  fs.appendFileSync(CSV_FILE, row + '\n', 'utf8');
}

/**
 * Get current row count (excluding header)
 */
export function getRowCount() {
  if (!fs.existsSync(CSV_FILE)) {
    return 0;
  }
  const content = fs.readFileSync(CSV_FILE, 'utf8');
  const lines = content.trim().split('\n');
  return Math.max(0, lines.length - 1); // Exclude header
}
