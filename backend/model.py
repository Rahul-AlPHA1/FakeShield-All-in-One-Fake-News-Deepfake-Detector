# backend/model.py
import os
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from preprocessor import TextPreprocessor

class FakeNewsDetector:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=10000, ngram_range=(1, 2))
        self.classifier = LogisticRegression(random_state=42, max_iter=1000)
        self.preprocessor = TextPreprocessor()
        self.is_trained = False

    def train(self, texts, labels):
        print("Preprocessing training texts...")
        cleaned_texts = [self.preprocessor.clean_text(text) for text in texts]
        
        print("Vectorizing texts...")
        X = self.vectorizer.fit_transform(cleaned_texts)
        
        print("Training Logistic Regression model...")
        self.classifier.fit(X, labels)
        self.is_trained = True
        print("Training complete.")

    def predict(self, text):
        if not self.is_trained:
            raise ValueError("Model is not trained or loaded yet.")
            
        cleaned_text = self.preprocessor.clean_text(text)
        if not cleaned_text.strip():
            return {
                "label": "UNKNOWN",
                "confidence": 0.0,
                "top_keywords": []
            }
            
        X = self.vectorizer.transform([cleaned_text])
        
        # Get prediction and probability
        prediction = self.classifier.predict(X)[0]
        probabilities = self.classifier.predict_proba(X)[0]
        confidence = float(max(probabilities))
        
        # Extract top keywords for this specific text
        feature_names = self.vectorizer.get_feature_names_out()
        
        # Get non-zero features in the input text
        nonzero_indices = X[0].nonzero()[1]
        
        # Sort by TF-IDF weight and get top 5
        if len(nonzero_indices) > 0:
            tfidf_scores = [(feature_names[idx], X[0, idx]) for idx in nonzero_indices]
            tfidf_scores.sort(key=lambda x: x[1], reverse=True)
            top_keywords = [word for word, score in tfidf_scores[:5]]
        else:
            top_keywords = []
            
        return {
            "label": prediction,
            "confidence": confidence,
            "top_keywords": top_keywords
        }

    def save_model(self, dir_path):
        os.makedirs(dir_path, exist_ok=True)
        joblib.dump(self.classifier, os.path.join(dir_path, 'model.pkl'))
        joblib.dump(self.vectorizer, os.path.join(dir_path, 'vectorizer.pkl'))
        print(f"Model saved to {dir_path}")

    def load_model(self, dir_path):
        model_path = os.path.join(dir_path, 'model.pkl')
        vec_path = os.path.join(dir_path, 'vectorizer.pkl')
        
        if os.path.exists(model_path) and os.path.exists(vec_path):
            self.classifier = joblib.load(model_path)
            self.vectorizer = joblib.load(vec_path)
            self.is_trained = True
            print("Model loaded successfully.")
            return True
        else:
            print("Model files not found.")
            return False
