"""
Scam SMS Prediction Script
Load trained model for prediction
"""

import joblib
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

class ScamPredictor:
    def __init__(self, model_path='scam_detector_model.pkl'):
        """Load model"""
        print("📦 Loading model...")
        model_data = joblib.load(model_path)
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.tfidf_vectorizer = model_data.get('tfidf_vectorizer')
        self.keyword_vectorizer = model_data.get('keyword_vectorizer')
        self.feature_columns = model_data['feature_columns']
        self.use_text_features = model_data.get('use_text_features', False)
        print(f"✅ Model loaded successfully (features: {len(self.feature_columns)})")
        if self.use_text_features:
            print(f"   Text features enabled: TF-IDF vectorizers loaded")
    
    def prepare_features(self, message_data):
        """
        Prepare features for prediction
        message_data: dict containing all feature columns (including text fields)
        """
        # Create DataFrame
        df = pd.DataFrame([message_data])
        
        # Extract text features if model was trained with them
        if self.use_text_features and self.tfidf_vectorizer is not None:
            df = self._extract_text_features(df)
        
        # Ensure all feature columns exist
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0
        
        # Keep only required features
        X = df[self.feature_columns].fillna(0)
        
        # Handle data types
        for col in X.columns:
            if X[col].dtype == 'object':
                try:
                    X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0)
                except:
                    X[col] = 0
        
        return X
    
    def _extract_text_features(self, df):
        """Extract text features during prediction (mirrors training process)"""
        
        # Fill missing text
        df['message_text'] = df.get('message_text', '').fillna('')
        df['openai_reason'] = df.get('openai_reason', '').fillna('')
        df['openai_keywords'] = df.get('openai_keywords', '').fillna('')
        df['openai_emotion_triggers'] = df.get('openai_emotion_triggers', '').fillna('')
        df['openai_action_requested'] = df.get('openai_action_requested', '').fillna('')
        df['openai_impersonation_type'] = df.get('openai_impersonation_type', '').fillna('')
        
        # 1. TF-IDF from message_text
        if self.tfidf_vectorizer is not None:
            try:
                tfidf_matrix = self.tfidf_vectorizer.transform(df['message_text'])
                tfidf_features = pd.DataFrame(
                    tfidf_matrix.toarray(),
                    columns=[f'tfidf_msg_{i}' for i in range(tfidf_matrix.shape[1])],
                    index=df.index
                )
                df = pd.concat([df, tfidf_features], axis=1)
            except Exception as e:
                print(f"Warning: TF-IDF transform failed: {e}")
        
        # 2. TF-IDF from openai_keywords
        if self.keyword_vectorizer is not None:
            try:
                keyword_tfidf_matrix = self.keyword_vectorizer.transform(df['openai_keywords'])
                keyword_tfidf_features = pd.DataFrame(
                    keyword_tfidf_matrix.toarray(),
                    columns=[f'tfidf_kw_{i}' for i in range(keyword_tfidf_matrix.shape[1])],
                    index=df.index
                )
                df = pd.concat([df, keyword_tfidf_features], axis=1)
            except Exception as e:
                print(f"Warning: Keyword TF-IDF transform failed: {e}")
        
        # 3. Keyword count
        df['keyword_count'] = df['openai_keywords'].apply(
            lambda x: len(str(x).split(',')) if pd.notna(x) and str(x).strip() else 0
        )
        
        # 4. Reason length
        df['reason_length'] = df['openai_reason'].apply(
            lambda x: len(str(x)) if pd.notna(x) else 0
        )
        
        # 5. Emotion trigger count
        df['emotion_trigger_count'] = df['openai_emotion_triggers'].apply(
            lambda x: len(str(x).split(',')) if pd.notna(x) and str(x).strip() else 0
        )
        
        # 6. Action type one-hot encoding
        common_actions = ['click_link', 'reply', 'call_number', 'provide_info']
        for action in common_actions:
            df[f'action_{action}'] = df['openai_action_requested'].apply(
                lambda x: 1 if str(x).lower() == action else 0
            )
        
        # 7. Impersonation type one-hot encoding
        common_impersonations = ['company', 'bank', 'government', 'courier']
        for imp_type in common_impersonations:
            df[f'impersonate_{imp_type}'] = df['openai_impersonation_type'].apply(
                lambda x: 1 if str(x).lower() == imp_type else 0
            )
        
        return df
    
    def predict(self, message_data):
        """
        Predict single message
        Returns: dict with prediction results and top contributing features
        """
        # Prepare features
        X = self.prepare_features(message_data)
        
        # Standardize
        X_scaled = self.scaler.transform(X)
        
        # Predict
        prediction = self.model.predict(X_scaled)[0]
        probability = self.model.predict_proba(X_scaled)[0]
        
        # Determine confidence level
        scam_prob = probability[1]
        if scam_prob >= 0.8:
            confidence = "High"
        elif scam_prob >= 0.6:
            confidence = "Medium"
        else:
            confidence = "Low"
        
        # Get top 5 features supporting scam prediction
        top_features = self._get_top_features(X, prediction)
        
        return {
            'is_scam': bool(prediction == 1),
            'scam_probability': float(scam_prob),
            'normal_probability': float(probability[0]),
            'confidence': confidence,
            'prediction_label': 'Scam' if prediction == 1 else 'Normal',
            'top_scam_factors': top_features
        }
    
    def _get_top_features(self, X, prediction):
        """
        Get top 5 features contributing to scam prediction
        """
        try:
            # Get feature importances from model
            feature_importances = self.model.feature_importances_
            
            # Get feature values for this instance
            feature_values = X.values[0]
            
            # Calculate contribution score (importance * value)
            contributions = []
            for i, (feat_name, importance, value) in enumerate(zip(self.feature_columns, feature_importances, feature_values)):
                if value > 0:  # Only consider non-zero features
                    contributions.append({
                        'feature': feat_name,
                        'value': float(value),
                        'importance': float(importance),
                        'contribution_score': float(importance * value)
                    })
            
            # Sort by contribution score and get top 5
            contributions.sort(key=lambda x: x['contribution_score'], reverse=True)
            top_5 = contributions[:5]
            
            return top_5
        except Exception as e:
            print(f"Warning: Could not calculate top features: {e}")
            return []
    
    def predict_batch(self, messages_data):
        """Batch prediction"""
        results = []
        for msg_data in messages_data:
            result = self.predict(msg_data)
            results.append(result)
        return results

def demo():
    """Demo prediction functionality"""
    print("=" * 60)
    print("🔍 Scam SMS Prediction Demo")
    print("=" * 60)
    
    # Load model
    predictor = ScamPredictor()
    
    # Test case 1: Potential scam message with text features
    test_message_1 = {
        # Text features
        'message_text': '【緊急通知】您的包裹因地址不詳無法配送,請立即點擊 http://bit.ly/pkg123 補填資料並支付運費99元,逾期將退回!',
        'openai_keywords': '緊急,包裹,點擊,支付,運費',
        'openai_reason': '要求點擊可疑連結並支付金錢,使用緊急語氣施壓',
        'openai_emotion_triggers': '緊急,逾期,退回',
        'openai_action_requested': 'click_link',
        'openai_impersonation_type': 'courier',
        
        # Numeric features
        'message_length': 68,
        'contains_urgent_words': 1,
        'contains_money_keywords': 1,
        'contains_link_text': 1,
        'has_url': 1,
        'url_is_shortened': 1,
        'special_char_count': 15,
        'exclamation_count': 1,
        'openai_is_scam': 1,
        'openai_confidence': 95,
        'openai_urgency_level': 9,
        'openai_threat_level': 7,
        'openai_credibility_score': 2,
        'avg_word_length': 4.5,
        'digit_ratio': 0.1,
        'uppercase_ratio': 0.05,
        'contains_phone': 0,
        'phone_count': 0,
        'has_email': 0,
        'number_sequence_count': 1,
        'contains_time_sensitive': 1,
        'question_mark_count': 0,
        'capitalized_word_count': 0,
        'word_count': 30,
        'unique_word_ratio': 0.8,
        'punctuation_ratio': 0.1,
        'contains_please': 0,
        'contains_verify': 0,
        'contains_account': 0,
        'contains_prize': 0,
        'contains_act_now': 0
    }
    
    # Test case 2: Potential normal message with text features
    test_message_2 = {
        # Text features
        'message_text': '您好,這是來自銀行的通知:您的信用卡帳單已產生,本期應繳金額3500元,繳款期限為本月25日。',
        'openai_keywords': '銀行,信用卡,帳單,繳款',
        'openai_reason': '正常的銀行帳單通知,無要求立即行動或點擊連結',
        'openai_emotion_triggers': '',
        'openai_action_requested': 'reply',
        'openai_impersonation_type': 'bank',
        
        # Numeric features
        'message_length': 45,
        'contains_urgent_words': 0,
        'contains_money_keywords': 1,
        'contains_link_text': 0,
        'has_url': 0,
        'url_is_shortened': 0,
        'special_char_count': 5,
        'exclamation_count': 0,
        'openai_is_scam': 0,
        'openai_confidence': 85,
        'openai_urgency_level': 2,
        'openai_threat_level': 0,
        'openai_credibility_score': 8,
        'avg_word_length': 4.2,
        'digit_ratio': 0.08,
        'uppercase_ratio': 0.0,
        'contains_phone': 0,
        'phone_count': 0,
        'has_email': 0,
        'number_sequence_count': 2,
        'contains_time_sensitive': 1,
        'question_mark_count': 0,
        'capitalized_word_count': 0,
        'word_count': 25,
        'unique_word_ratio': 0.9,
        'punctuation_ratio': 0.05,
        'contains_please': 0,
        'contains_verify': 0,
        'contains_account': 0,
        'contains_prize': 0,
        'contains_act_now': 0
    }
    
    print("\n" + "="*60)
    print("Test Case 1: Suspected Scam (Package + Payment)")
    print("="*60)
    print(f"Message: {test_message_1['message_text'][:60]}...")
    result_1 = predictor.predict(test_message_1)
    print(f"\n  📊 Prediction: {result_1['prediction_label']}")
    print(f"  📈 Scam Probability: {result_1['scam_probability']:.2%}")
    print(f"  🎯 Confidence Level: {result_1['confidence']}")
    print(f"\n  🔍 Top 5 Scam Factors:")
    for i, factor in enumerate(result_1['top_scam_factors'], 1):
        print(f"     {i}. {factor['feature']}: {factor['value']:.4f} (importance: {factor['importance']:.4f})")
    
    print("\n" + "="*60)
    print("Test Case 2: Suspected Normal (Bank Bill)")
    print("="*60)
    print(f"Message: {test_message_2['message_text'][:60]}...")
    result_2 = predictor.predict(test_message_2)
    print(f"\n  📊 Prediction: {result_2['prediction_label']}")
    print(f"  📈 Scam Probability: {result_2['scam_probability']:.2%}")
    print(f"  🎯 Confidence Level: {result_2['confidence']}")
    print(f"\n  🔍 Top 5 Factors:")
    for i, factor in enumerate(result_2['top_scam_factors'], 1):
        print(f"     {i}. {factor['feature']}: {factor['value']:.4f} (importance: {factor['importance']:.4f})")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    demo()
