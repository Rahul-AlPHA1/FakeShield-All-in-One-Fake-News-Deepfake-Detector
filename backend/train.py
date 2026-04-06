# backend/train.py
import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from model import FakeNewsDetector

def create_synthetic_dataset():
    # 20 Fake and 20 Real examples
    data = [
        # FAKE NEWS
        ("Aliens have landed in New York and are taking over the government.", "FAKE"),
        ("Drinking bleach cures all known viruses immediately.", "FAKE"),
        ("The earth is actually flat and NASA is hiding the truth.", "FAKE"),
        ("A new study shows that eating chocolate every day makes you lose weight.", "FAKE"),
        ("Secret government documents reveal that birds are actually surveillance drones.", "FAKE"),
        ("Local man discovers infinite energy source in his garage using magnets.", "FAKE"),
        ("Celebrity X was found alive on a remote island after faking their death.", "FAKE"),
        ("New law requires all citizens to microchip their pets for tracking.", "FAKE"),
        ("Scientists have successfully cloned a dinosaur in a secret lab.", "FAKE"),
        ("Water will be completely privatized by next year, experts warn.", "FAKE"),
        ("A giant asteroid is on a collision course with Earth tomorrow.", "FAKE"),
        ("Using your smartphone in the dark causes immediate blindness.", "FAKE"),
        ("The moon landing was filmed in a Hollywood basement.", "FAKE"),
        ("Eating 10 apples a day grants immortality.", "FAKE"),
        ("A new app can charge your phone battery using just the air.", "FAKE"),
        ("Politician Y is actually a reptilian shapeshifter.", "FAKE"),
        ("Vaccines contain tracking microchips controlled by 5G towers.", "FAKE"),
        ("Drinking 5 liters of coffee a day is the secret to eternal youth.", "FAKE"),
        ("A portal to another dimension opened up in the middle of the ocean.", "FAKE"),
        ("The government is controlling the weather using giant lasers.", "FAKE"),
        
        # REAL NEWS
        ("The stock market closed slightly higher today after tech earnings reports.", "REAL"),
        ("A new species of frog was discovered in the Amazon rainforest.", "REAL"),
        ("The city council voted to increase funding for public transportation.", "REAL"),
        ("Scientists have developed a more efficient solar panel technology.", "REAL"),
        ("The national unemployment rate dropped by 0.2% last month.", "REAL"),
        ("A major earthquake struck the coastal region, causing minor damage.", "REAL"),
        ("The local sports team won their championship game last night.", "REAL"),
        ("A new public library opened downtown with modern facilities.", "REAL"),
        ("Researchers published a study on the effects of climate change on coral reefs.", "REAL"),
        ("The tech company announced a new flagship smartphone model.", "REAL"),
        ("A historic building is being renovated to serve as a community center.", "REAL"),
        ("The space agency successfully launched a new satellite into orbit.", "REAL"),
        ("A medical breakthrough could lead to better treatments for diabetes.", "REAL"),
        ("The annual city marathon saw record participation this year.", "REAL"),
        ("A new trade agreement was signed between the two neighboring countries.", "REAL"),
        ("The local university received a grant for renewable energy research.", "REAL"),
        ("A popular restaurant chain is expanding its operations internationally.", "REAL"),
        ("The government passed a bill to improve healthcare access for veterans.", "REAL"),
        ("A rare astronomical event will be visible in the night sky this weekend.", "REAL"),
        ("The documentary film won several awards at the international festival.", "REAL")
    ]
    
    df = pd.DataFrame(data, columns=["text", "label"])
    return df

def main():
    print("Creating synthetic dataset...")
    df = create_synthetic_dataset()
    
    X_train, X_test, y_train, y_test = train_test_split(df['text'], df['label'], test_size=0.2, random_state=42)
    
    detector = FakeNewsDetector()
    detector.train(X_train, y_train)
    
    print("\nEvaluating model...")
    predictions = [detector.predict(text)["label"] for text in X_test]
    accuracy = accuracy_score(y_test, predictions)
    print(f"Model Accuracy on test split: {accuracy * 100:.2f}%")
    
    print("\nExtracting top features...")
    feature_names = detector.vectorizer.get_feature_names_out()
    coefs = detector.classifier.coef_[0]
    
    # Sort coefficients
    top_fake_indices = coefs.argsort()[:10]  # Negative coefficients for FAKE (if FAKE is 0, REAL is 1)
    top_real_indices = coefs.argsort()[-10:][::-1] # Positive coefficients for REAL
    
    # Assuming classes are sorted alphabetically: FAKE is 0, REAL is 1
    classes = detector.classifier.classes_
    if classes[0] == 'FAKE':
        fake_idx, real_idx = 0, 1
    else:
        fake_idx, real_idx = 1, 0
        
    if fake_idx == 0:
        fake_features = [feature_names[i] for i in top_fake_indices]
        real_features = [feature_names[i] for i in top_real_indices]
    else:
        fake_features = [feature_names[i] for i in top_real_indices]
        real_features = [feature_names[i] for i in top_fake_indices]
        
    print(f"\nTop 10 features for FAKE class:\n{fake_features}")
    print(f"\nTop 10 features for REAL class:\n{real_features}")
    
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    detector.save_model(models_dir)

if __name__ == "__main__":
    main()
