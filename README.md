# 🏛️ Jan-Samadhan AI (ಜನ-ಸಮಾಧಾನ)
> **Minimalist, Zero-Cost Multilingual Civic Grievance AI & Ward Officer Command Center**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Jan-Samadhan AI bridges the gap between Bengaluru citizens and municipal administration (BBMP). Citizens can report civic issues in **Kannada (ಕನ್ನಡ)**, **Hindi (हिंदी)**, or **English** using native voice speech recognition or 1-click test chips. The system automatically categorizes the grievance, translates it to administrative municipal English, enforces BBMP statutory SLAs, and provides ward officers with a real-time command dashboard with photo proof-of-work verification.

---

## ⚡ Zero-Cost Architecture

- **Frontend & Backend**: Next.js 14 (App Router) + Tailwind CSS + Lucide React.
- **Audio Capture**: Browser-native Web Speech API (`webkitSpeechRecognition`) supporting `'kn-IN'`, `'hi-IN'`, and `'en-IN'`. No paid speech-to-text API required!
- **AI & Triaging Engine**: `/api/triage` connects to Google Gemini Flash (free tier) if `GEMINI_API_KEY` is present. If absent, an **intelligent deterministic internal rule engine** immediately takes over — the app **never crashes or fails**.
- **State & Database**: Browser `localStorage` pre-seeded with 4 realistic Bengaluru municipal grievance tickets across Solid Waste Management (SWM), Water (BWSSB), Electrical (BESCOM), and PWD.

---

## 🚀 Quick Start (Local)

1. Clone or open the project:
   ```bash
   cd hackaton
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set up Gemini API key:
   ```bash
   cp .env.example .env.local
   # Add your key to .env.local: GEMINI_API_KEY=your_key_here
   ```
   *Note: Even without an API key, all features work out-of-the-box!*

4. Run development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deploy to Vercel (100% Free, 1-Click)

1. Push this repository to **GitHub**.
2. Go to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your GitHub repository.
4. (Optional) In **Environment Variables**, add `GEMINI_API_KEY` with your free Google AI Studio key.
5. Click **Deploy**. Your app will be live with a free `https://your-project.vercel.app` domain and SSL.

---

## 🎯 Key Features

- **Multilingual Vernacular Input**: Real-time voice transcription or regional Unicode text input.
- **Quick Demo Chips**: 1-click presets for noisy hackathon environments.
- **2-Second Animated Stepper**: Simulates dialect detection, translation, department classification, and officer assignment.
- **Dual-View Ticket Cards**: Displays original citizen vernacular input right beside the municipal English translation.
- **Live SLA Countdown Clocks**: Real-time ticking timers (`Remaining: HH:MM:SS`), with pulsing red alerts when `< 6 hours`.
- **Proof-of-Work Verification**: Photo resolution presets and simulated citizen SMS toast notifications.
