# 🛡️ FakeShield — AI Fake Content Detection Platform

**FakeShield** is an enterprise-grade, ultra-instinct UI misinformation detection platform architected by **Rahool Gir**. It leverages advanced AI to detect fake news, video deepfakes, and AI voice clones all in a single, seamless application.

## ✨ Features
*   **📰 Text & URL Analysis:** Detects misinformation, clickbait, and AI-written articles. Includes a built-in web scraper to analyze live URLs.
*   **🎥 Video Deepfake Detection:** Analyzes video frames for unnatural blink patterns, facial inconsistencies, and color bleeding.
*   **🎤 Voice Clone Detection:** Spots AI voice clones and TTS-generated audio using spectral analysis and prosody checks.
*   **🎨 Ultra Instinct UI:** Features a futuristic, glassmorphism design with mouse-following aura effects, animated tabs, and dark/light mode support.

## 🛠️ Tech Stack
*   **Frontend:** React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons
*   **Backend:** Node.js, Express.js, Cheerio (Web Scraping)
*   **AI Integration:** Google Gemini 3.1 Flash (Multimodal Analysis), Groq, Ollama
*   **Build Tool:** Vite

## 📋 Prerequisites
Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   npm (comes with Node.js)
*   A [Google Gemini API Key](https://aistudio.google.com/app/apikey) (Required for Video/Voice analysis)

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Rahul-AlPHA1/FakeShield.git
   cd FakeShield
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *(Alternatively, you can enter the API key directly in the app's Settings UI).*

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Visit `http://localhost:3000` in your browser.

## 👨‍💻 Author
**Rahool Gir**
*Mid-Level Software Engineer | Java · Spring Boot · Quarkus · React*
*   **Portfolio:** [rahul-alpha1.github.io/RahoolPortfolio.com](https://rahul-alpha1.github.io/RahoolPortfolio.com)
*   **LinkedIn:** [linkedin.com/in/rahool-goswami-4b055a126](https://linkedin.com/in/rahool-goswami-4b055a126)
*   **GitHub:** [@Rahul-AlPHA1](https://github.com/Rahul-AlPHA1)
*   **Email:** rahool.goswami16@gmail.com
