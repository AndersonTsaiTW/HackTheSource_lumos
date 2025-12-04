"""
Flask API Service
Provide REST API for Node.js to call scam detection model
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from predict import ScamPredictor
import traceback

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# Load model
print("🚀 Starting API service...")
try:
    predictor = ScamPredictor()
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Model loading failed: {e}")
    predictor = None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': predictor is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict single message
    
    POST /predict
    Content-Type: application/json
    
    Request Body:
    {
        "message_length": 300,
        "contains_urgent_words": 1,
        "contains_money_keywords": 1,
        ...other features
    }
    
    Response:
    {
        "success": true,
        "result": {
            "is_scam": true,
            "scam_probability": 0.95,
            "normal_probability": 0.05,
            "confidence": "High",
            "prediction_label": "Scam"
        }
    }
    """
    try:
        if predictor is None:
            return jsonify({
                'success': False,
                'error': 'Model not loaded'
            }), 500
        
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Please provide message feature data'
            }), 400
        
        # Predict
        result = predictor.predict(data)
        
        return jsonify({
            'success': True,
            'result': result
        })
    
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """
    Batch prediction
    
    POST /predict/batch
    Content-Type: application/json
    
    Request Body:
    {
        "messages": [
            {...features1...},
            {...features2...}
        ]
    }
    
    Response:
    {
        "success": true,
        "results": [
            {...result1...},
            {...result2...}
        ]
    }
    """
    try:
        if predictor is None:
            return jsonify({
                'success': False,
                'error': 'Model not loaded'
            }), 500
        
        # Get request data
        data = request.get_json()
        
        if not data or 'messages' not in data:
            return jsonify({
                'success': False,
                'error': 'Please provide messages array'
            }), 400
        
        messages = data['messages']
        
        if not isinstance(messages, list):
            return jsonify({
                'success': False,
                'error': 'messages must be an array'
            }), 400
        
        # Batch prediction
        results = predictor.predict_batch(messages)
        
        return jsonify({
            'success': True,
            'results': results,
            'count': len(results)
        })
    
    except Exception as e:
        print(f"❌ Batch prediction error: {e}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/model/info', methods=['GET'])
def model_info():
    """Get model information"""
    try:
        if predictor is None:
            return jsonify({
                'success': False,
                'error': 'Model not loaded'
            }), 500
        
        return jsonify({
            'success': True,
            'info': {
                'feature_count': len(predictor.feature_columns),
                'features': predictor.feature_columns
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("🌐 API Service Started")
    print("=" * 60)
    print("\nAvailable Endpoints:")
    print("  GET  /health          - Health check")
    print("  POST /predict         - Single message prediction")
    print("  POST /predict/batch   - Batch prediction")
    print("  GET  /model/info      - Model information")
    print("\nService Address: http://localhost:5000")
    print("=" * 60 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
