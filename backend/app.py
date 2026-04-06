# backend/app.py
import os
import time
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from model import FakeNewsDetector

app = Flask(__name__)
CORS(app)

# Initialize and load model
detector = FakeNewsDetector()
models_dir = os.path.join(os.path.dirname(__file__), 'models')

# Try to load model, if it fails, it will need to be trained
model_loaded = detector.load_model(models_dir)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "model_loaded": model_loaded
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    if not model_loaded:
        return jsonify({"error": "Model not loaded. Please run train.py first."}), 500
        
    data = request.json
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400
        
    text = data['text']
    
    if len(text.strip()) < 10:
        return jsonify({"error": "Please enter more text (at least 10 characters)."}), 400
        
    start_time = time.time()
    
    try:
        result = detector.predict(text)
        processing_time_ms = round((time.time() - start_time) * 1000, 2)
        word_count = len(text.split())
        
        return jsonify({
            "label": result["label"],
            "confidence": result["confidence"],
            "top_keywords": result["top_keywords"],
            "word_count": word_count,
            "processing_time_ms": processing_time_ms
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/feedback', methods=['POST'])
def feedback():
    data = request.json
    if not data or 'text' not in data or 'predicted_label' not in data or 'correct_label' not in data:
        return jsonify({"error": "Missing required fields"}), 400
        
    feedback_entry = {
        "timestamp": time.time(),
        "text": data['text'],
        "predicted_label": data['predicted_label'],
        "correct_label": data['correct_label']
    }
    
    feedback_file = os.path.join(os.path.dirname(__file__), 'feedback.json')
    
    try:
        feedbacks = []
        if os.path.exists(feedback_file):
            with open(feedback_file, 'r') as f:
                feedbacks = json.load(f)
                
        feedbacks.append(feedback_entry)
        
        with open(feedback_file, 'w') as f:
            json.dump(feedbacks, f, indent=2)
            
        return jsonify({"status": "success", "message": "Feedback recorded"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
