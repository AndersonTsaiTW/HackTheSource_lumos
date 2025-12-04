"""
Scam SMS Detection Model Training Script
Train classification model using XGBoost, handling class imbalance
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, roc_curve
from sklearn.preprocessing import StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
import xgboost as xgb
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
import json
from datetime import datetime
import re

# Set font for plotting (if needed)
plt.rcParams['font.sans-serif'] = ['Microsoft JhengHei', 'Arial Unicode MS']
plt.rcParams['axes.unicode_minus'] = False

class ScamDetectionModel:
    def __init__(self, data_path='training_data.csv', use_text_features=True):
        self.data_path = data_path
        self.model = None
        self.scaler = None
        self.tfidf_vectorizer = None
        self.keyword_vectorizer = None
        self.feature_columns = None
        self.metrics = {}
        self.use_text_features = use_text_features
        
    def load_data(self):
        """Load training data"""
        print("📁 Loading data...")
        df = pd.read_csv(self.data_path)
        print(f"Total records: {len(df)}")
        print(f"Scam messages: {(df['label'] == 1).sum()}")
        print(f"Normal messages: {(df['label'] == 0).sum()}")
        return df
    
    def preprocess_data(self, df):
        """Preprocess data"""
        print("\n🔧 Preprocessing data...")
        
        # Extract text features if enabled
        if self.use_text_features:
            print("   Extracting text features from message_text...")
            df = self.extract_text_features(df)
        
        # Remove unnecessary columns
        exclude_cols = ['message_id', 'source', 'message_text', 'url_domain', 
                       'phone_number', 'phone_carrier', 'openai_reason', 
                       'openai_keywords', 'openai_impersonation_type', 
                       'openai_action_requested', 'openai_emotion_triggers']
        
        # Get feature columns
        self.feature_columns = [col for col in df.columns 
                               if col not in exclude_cols + ['label']]
        
        # Handle missing values
        X = df[self.feature_columns].copy()
        X = X.fillna(0)
        
        # Handle boolean and string types
        for col in X.columns:
            if X[col].dtype == 'object':
                # Try to convert to numeric
                try:
                    X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0)
                except:
                    X[col] = 0
        
        y = df['label']
        
        print(f"Number of features: {len(self.feature_columns)}")
        print(f"Feature columns: {', '.join(self.feature_columns[:5])}... (total {len(self.feature_columns)})")
        
        return X, y
    
    def extract_text_features(self, df):
        """Extract numerical features from text columns"""
        
        # Fill missing text
        df['message_text'] = df['message_text'].fillna('')
        df['openai_reason'] = df['openai_reason'].fillna('')
        df['openai_keywords'] = df['openai_keywords'].fillna('')
        
        # 1. TF-IDF features from message_text (top 20 words)
        print("      - Applying TF-IDF vectorization to message_text...")
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=20,
            min_df=2,
            max_df=0.8,
            ngram_range=(1, 2),
            stop_words='english'
        )
        
        try:
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(df['message_text'])
            tfidf_features = pd.DataFrame(
                tfidf_matrix.toarray(),
                columns=[f'tfidf_msg_{i}' for i in range(tfidf_matrix.shape[1])],
                index=df.index
            )
            df = pd.concat([df, tfidf_features], axis=1)
            print(f"      - Added {tfidf_matrix.shape[1]} TF-IDF features from message_text")
        except Exception as e:
            print(f"      - TF-IDF extraction from message_text failed: {e}")
        
        # 2. TF-IDF features from openai_keywords (top 15 keywords)
        print("      - Applying TF-IDF vectorization to openai_keywords...")
        self.keyword_vectorizer = TfidfVectorizer(
            max_features=15,
            min_df=2,
            max_df=0.8,
            token_pattern=r'(?u)\b\w+\b',  # Match words
            lowercase=True
        )
        
        try:
            keyword_tfidf_matrix = self.keyword_vectorizer.fit_transform(df['openai_keywords'])
            keyword_tfidf_features = pd.DataFrame(
                keyword_tfidf_matrix.toarray(),
                columns=[f'tfidf_kw_{i}' for i in range(keyword_tfidf_matrix.shape[1])],
                index=df.index
            )
            df = pd.concat([df, keyword_tfidf_features], axis=1)
            print(f"      - Added {keyword_tfidf_matrix.shape[1]} TF-IDF features from keywords")
        except Exception as e:
            print(f"      - TF-IDF extraction from keywords failed: {e}")
        
        # 3. Keyword count (as backup numeric feature)
        df['keyword_count'] = df['openai_keywords'].apply(
            lambda x: len(str(x).split(',')) if pd.notna(x) and str(x).strip() else 0
        )
        
        # 3. Extract features from openai_reason (text length)
        df['reason_length'] = df['openai_reason'].apply(
            lambda x: len(str(x)) if pd.notna(x) else 0
        )
        
        # 4. Sentiment-like features from openai_emotion_triggers
        df['emotion_trigger_count'] = df['openai_emotion_triggers'].apply(
            lambda x: len(str(x).split(',')) if pd.notna(x) and str(x).strip() else 0
        )
        
        # 5. Action type encoding (one-hot for common actions)
        common_actions = ['click_link', 'reply', 'call_number', 'provide_info']
        for action in common_actions:
            df[f'action_{action}'] = df['openai_action_requested'].apply(
                lambda x: 1 if str(x).lower() == action else 0
            )
        
        # 6. Impersonation type encoding
        common_impersonations = ['company', 'bank', 'government', 'courier']
        for imp_type in common_impersonations:
            df[f'impersonate_{imp_type}'] = df['openai_impersonation_type'].apply(
                lambda x: 1 if str(x).lower() == imp_type else 0
            )
        
        print(f"      - Total new features extracted from text")
        
        return df
    
    def train(self, X, y):
        """Train model"""
        print("\n🎯 Starting model training...")
        
        # Split train and test sets
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        print(f"Training set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")
        
        # Standardize features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Calculate class weights (handle imbalance)
        scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
        print(f"Class weight adjustment: {scale_pos_weight:.2f}")
        
        # XGBoost parameters (optimized for small dataset)
        params = {
            'objective': 'binary:logistic',
            'eval_metric': 'logloss',
            'scale_pos_weight': scale_pos_weight,
            'max_depth': 3,  # Shallow trees to prevent overfitting
            'learning_rate': 0.1,
            'n_estimators': 100,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'min_child_weight': 3,  # Increase to prevent overfitting
            'random_state': 42,
            'verbosity': 0
        }
        
        # Train model
        self.model = xgb.XGBClassifier(**params)
        self.model.fit(X_train_scaled, y_train)
        
        # 5-Fold cross validation
        print("\n📊 Performing 5-Fold cross validation...")
        cv_scores = cross_val_score(
            self.model, X_train_scaled, y_train, 
            cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
            scoring='f1'
        )
        print(f"Cross-validation F1 score: {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")
        
        # Evaluate model
        self.evaluate(X_train_scaled, y_train, X_test_scaled, y_test)
        
        return X_test_scaled, y_test
    
    def evaluate(self, X_train, y_train, X_test, y_test):
        """Evaluate model performance"""
        print("\n📈 Model Evaluation Results:")
        
        # Training set predictions
        y_train_pred = self.model.predict(X_train)
        train_accuracy = (y_train_pred == y_train).mean()
        
        # Test set predictions
        y_test_pred = self.model.predict(X_test)
        y_test_proba = self.model.predict_proba(X_test)[:, 1]
        
        test_accuracy = (y_test_pred == y_test).mean()
        
        print(f"\nTraining accuracy: {train_accuracy:.3f}")
        print(f"Test accuracy: {test_accuracy:.3f}")
        
        # Detailed classification report
        print("\nClassification Report:")
        print(classification_report(y_test, y_test_pred, 
                                   target_names=['Normal', 'Scam'],
                                   digits=3))
        
        # Confusion matrix
        cm = confusion_matrix(y_test, y_test_pred)
        print("Confusion Matrix:")
        print(f"              Pred Normal  Pred Scam")
        print(f"Actual Normal    {cm[0][0]:6d}      {cm[0][1]:6d}")
        print(f"Actual Scam      {cm[1][0]:6d}      {cm[1][1]:6d}")
        
        # ROC-AUC
        try:
            roc_auc = roc_auc_score(y_test, y_test_proba)
            print(f"\nROC-AUC Score: {roc_auc:.3f}")
        except:
            roc_auc = None
        
        # Save evaluation metrics
        self.metrics = {
            'train_accuracy': float(train_accuracy),
            'test_accuracy': float(test_accuracy),
            'roc_auc': float(roc_auc) if roc_auc else None,
            'confusion_matrix': cm.tolist(),
            'timestamp': datetime.now().isoformat()
        }
    
    def plot_feature_importance(self, top_n=20):
        """Plot feature importance"""
        print(f"\n📊 Plotting top {top_n} important features...")
        
        importance_df = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False).head(top_n)
        
        plt.figure(figsize=(10, 8))
        sns.barplot(data=importance_df, y='feature', x='importance')
        plt.title('Feature Importance Ranking')
        plt.xlabel('Importance Score')
        plt.ylabel('Feature')
        plt.tight_layout()
        plt.savefig('feature_importance.png', dpi=300, bbox_inches='tight')
        print("✅ Feature importance plot saved: feature_importance.png")
        
        # Display top 10 important features
        print("\nTop 10 Important Features:")
        for idx, row in importance_df.head(10).iterrows():
            print(f"  {row['feature']}: {row['importance']:.4f}")
    
    def save_model(self, model_path='scam_detector_model.pkl'):
        """Save model"""
        print(f"\n💾 Saving model...")
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'tfidf_vectorizer': self.tfidf_vectorizer,
            'keyword_vectorizer': self.keyword_vectorizer,
            'feature_columns': self.feature_columns,
            'metrics': self.metrics,
            'use_text_features': self.use_text_features
        }
        
        joblib.dump(model_data, model_path)
        print(f"✅ Model saved: {model_path}")
        
        # Save feature columns list
        with open('feature_columns.json', 'w', encoding='utf-8') as f:
            json.dump(self.feature_columns, f, ensure_ascii=False, indent=2)
        print(f"✅ Feature list saved: feature_columns.json")
        
        # Save evaluation metrics
        with open('model_metrics.json', 'w', encoding='utf-8') as f:
            json.dump(self.metrics, f, ensure_ascii=False, indent=2)
        print(f"✅ Evaluation metrics saved: model_metrics.json")

def main():
    """Main function"""
    print("=" * 60)
    print("🚀 Scam SMS Detection Model Training")
    print("=" * 60)
    
    # Initialize model with text features enabled
    detector = ScamDetectionModel(use_text_features=True)
    
    # Load data
    df = detector.load_data()
    
    # Preprocess
    X, y = detector.preprocess_data(df)
    
    # Train model
    X_test, y_test = detector.train(X, y)
    
    # Plot feature importance
    detector.plot_feature_importance()
    
    # Save model
    detector.save_model()
    
    print("\n" + "=" * 60)
    print("✅ Training Complete!")
    print("=" * 60)
    print("\nNext Steps:")
    print("1. View feature_importance.png to understand important features")
    print("2. View model_metrics.json to understand model performance")
    print("3. Run python predict.py to test prediction")
    print("4. Run python api_server.py to start API service")

if __name__ == "__main__":
    main()
