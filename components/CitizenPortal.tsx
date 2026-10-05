"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTickets } from '@/context/TicketContext';
import { SupportedLanguage, GrievanceTicket, WARDS_LIST, DEPARTMENT_CONFIGS } from '@/types';
import {
  Mic,
  MicOff,
  Sparkles,
  Send,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Clock,
  MapPin,
  User,
  Phone,
  FileText,
  RotateCcw,
  Volume2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface QuickChip {
  id: string;
  label: string;
  badge: string;
  lang: SupportedLanguage;
  ward: string;
  landmark: string;
  text: string;
}

const QUICK_CHIPS: QuickChip[] = [
  {
    id: 'chip-kn',
    label: 'ಕನ್ನಡ - ಕಸದ ಸಮಸ್ಯೆ (Waste)',
    badge: 'ಕನ್ನಡ',
    lang: 'Kannada',
    ward: 'Ward 150 - Bellandur',
    landmark: 'Opposite Bellandur Lake Gate 2',
    text: 'ನಮ್ಮ ಬೆಳ್ಳಂದೂರು ವಾರ್ಡ್ 150 ರಲ್ಲಿ ಕಸದ ತೊಟ್ಟಿ ತುಂಬಿ ರಸ್ತೆಗೆಲ್ಲ ಹರಡಿದೆ, ದಯವಿಟ್ಟು ಬೇಗ ಕ್ಲೀನ್ ಮಾಡಿಸಿ.',
  },
  {
    id: 'chip-hi',
    label: 'हिंदी - पानी की समस्या (Water)',
    badge: 'हिंदी',
    lang: 'Hindi',
    ward: 'Ward 174 - HSR Layout',
    landmark: 'Sector 2, 27th Main Junction',
    text: 'मेन रोड पर पानी का पाइप फट गया है और पूरा रास्ता भर गया है।',
  },
  {
    id: 'chip-en',
    label: 'English - Broken Light (Electrical)',
    badge: 'English',
    lang: 'English',
    ward: 'Ward 112 - Indiranagar',
    landmark: '14th Main near BDA Complex',
    text: 'Streetlight pole broken and sparking near 14th Main junction.',
  },
];

const STEPPER_STAGES = [
  { title: 'Detecting Dialect & Speech...', desc: 'Analyzing regional phonetic tokens (kn-IN / hi-IN / en-IN)' },
  { title: 'Translating to Municipal English...', desc: 'Standardizing civic terms into administrative English' },
  { title: 'Classifying Municipal Department...', desc: 'Mapping to BBMP SWM, BWSSB, BESCOM or PWD jurisdiction' },
  { title: 'Assigning Ward Officer & Enforcing SLA...', desc: 'Setting binding statutory countdown timer' },
];

export default function CitizenPortal({ onSwitchToDashboard }: { onSwitchToDashboard?: () => void }) {
  const { addTicket } = useTickets();

  // Form states
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('Kannada');
  const [text, setText] = useState<string>('');
  const [citizenName, setCitizenName] = useState<string>('Ramesh Gowda');
  const [phone, setPhone] = useState<string>('+91 98450 12345');
  const [ward, setWard] = useState<string>('Ward 150 - Bellandur');
  const [landmark, setLandmark] = useState<string>('Opposite Bellandur Lake Gate 2');
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('text');

  // Speech Recognition state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  // Stepper & Receipt state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [receiptTicket, setReceiptTicket] = useState<GrievanceTicket | null>(null);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your current browser. You can type or use the quick demo chips below.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      // Set language code based on selected tab
      if (selectedLanguage === 'Kannada') {
        recognition.lang = 'kn-IN';
      } else if (selectedLanguage === 'Hindi') {
        recognition.lang = 'hi-IN';
      } else {
        recognition.lang = 'en-IN';
      }

      recognition.onstart = () => {
        setIsRecording(true);
        setInputMode('voice');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
    }
  };

  const handleApplyChip = (chip: QuickChip) => {
    setText(chip.text);
    setSelectedLanguage(chip.lang);
    setWard(chip.ward);
    setLandmark(chip.landmark);
    setInputMode('text');
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setIsSubmitting(true);
    setCurrentStep(0);

    // Run 2-second animated stepper sequence
    const stepInterval = 500; // 500ms * 4 = 2000ms
    const stepTimer1 = setTimeout(() => setCurrentStep(1), stepInterval * 1);
    const stepTimer2 = setTimeout(() => setCurrentStep(2), stepInterval * 2);
    const stepTimer3 = setTimeout(() => setCurrentStep(3), stepInterval * 3);

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language: selectedLanguage,
          ward,
          landmark,
          citizenName,
          phone,
          inputMode,
        }),
      });

      const ticket: GrievanceTicket = await res.json();

      // Ensure minimum 2s elapsed for user to experience the full stepper
      setTimeout(() => {
        addTicket(ticket);
        setIsSubmitting(false);
        setReceiptTicket(ticket);
      }, 2100);
    } catch (err) {
      console.error('Submission failed, triggering resilient fallback', err);
      // Fallback ticket
      setTimeout(() => {
        const fallbackTicket: GrievanceTicket = {
          id: 'ticket-' + Date.now(),
          trackingId: `JS-BLR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          citizenName,
          phone,
          ward,
          landmark,
          inputMode,
          originalLanguage: selectedLanguage,
          originalText: text,
          englishTranslation: text,
          department: 'Public Works (PWD)',
          urgency: 'Medium',
          slaHours: 48,
          createdAt: new Date().toISOString(),
          deadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          status: 'Pending',
        };
        addTicket(fallbackTicket);
        setIsSubmitting(false);
        setReceiptTicket(fallbackTicket);
      }, 2100);
    }
  };

  const handleResetForm = () => {
    setText('');
    setReceiptTicket(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          Zero-Barrier Multilingual Voice Grievance Redressal
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Report Civic Issue <span className="text-emerald-400">In Any Language</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
          Speak or type in Kannada, Hindi, or English. Our AI dialect triaging engine instantly categorizes, translates, and enforces BBMP statutory SLAs.
        </p>
      </div>

      {/* Main Submission Form Card */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 border border-slate-700/60 shadow-2xl relative overflow-hidden">
        {/* Quick Demo Test Chips */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick Demo Test Chips (1-Click Fill)
            </span>
            <span className="text-xs text-slate-500">Perfect for noisy hackathons</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleApplyChip(chip)}
                className="text-left p-3 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 hover:border-emerald-500/40 transition-all text-xs group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white group-hover:text-emerald-300">
                    {chip.badge}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900/60 text-slate-400">
                    {chip.lang}
                  </span>
                </div>
                <p className="text-slate-300 line-clamp-2 italic font-mono text-[11px]">
                  "{chip.text}"
                </p>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Language Selector Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Select Reporting Language</span>
              <span className="text-[11px] text-slate-500">Web Speech API Target Dialect</span>
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
              {(['Kannada', 'Hindi', 'English'] as SupportedLanguage[]).map((lang) => {
                const labels: Record<SupportedLanguage, string> = {
                  Kannada: 'ಕನ್ನಡ (Kannada)',
                  Hindi: 'हिंदी (Hindi)',
                  English: 'English (Indian)',
                };
                const isSel = selectedLanguage === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setSelectedLanguage(lang);
                      if (isRecording && recognitionRef.current) {
                        recognitionRef.current.stop();
                        setIsRecording(false);
                      }
                    }}
                    className={`py-2 px-3 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                      isSel
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {labels[lang]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grievance Input: Textarea + Voice Capture Floating Controller */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                Describe Grievance (Voice or Regional Unicode Text)
              </label>
              <div className="flex items-center gap-2">
                {isRecording && (
                  <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    Listening live in {selectedLanguage}...
                  </span>
                )}
                <span className="text-[11px] text-slate-500">{text.length} chars</span>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                required
                placeholder={
                  selectedLanguage === 'Kannada'
                    ? 'ಇಲ್ಲಿ ನಿಮ್ಮ ದೂರು ನಮೂದಿಸಿ ಅಥವಾ ಮೈಕ್ ಬಟನ್ ಒತ್ತಿ ಮಾತನಾಡಿ...'
                    : selectedLanguage === 'Hindi'
                    ? 'यहाँ अपनी समस्या लिखें या माइक दबाकर बोलें...'
                    : 'Describe your civic issue or tap the microphone to speak...'
                }
                className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 pr-24 transition-all"
              />

              {/* Microphone Trigger Button */}
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleRecording}
                  title={isRecording ? 'Stop Recording' : 'Start Speech to Text'}
                  className={`p-3 rounded-xl transition-all flex items-center gap-2 shadow-lg ${
                    isRecording
                      ? 'bg-red-500 text-white recording-ring shadow-red-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500 hover:text-slate-950'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-5 h-5 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
                        Stop
                      </span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
                        Speak
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Citizen Details & Location Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Citizen Full Name
              </label>
              <input
                type="text"
                required
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                className="w-full rounded-xl bg-slate-900/80 border border-slate-700/70 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Mobile Number (for SMS Tracking)
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl bg-slate-900/80 border border-slate-700/70 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Municipal Ward (Bengaluru)
              </label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full rounded-xl bg-slate-900/80 border border-slate-700/70 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                {WARDS_LIST.map((w) => (
                  <option key={w} value={w} className="bg-slate-900 text-white">
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Landmark / Specific Location
              </label>
              <input
                type="text"
                required
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near 14th Main Junction, Opposite Bus Stop"
                className="w-full rounded-xl bg-slate-900/80 border border-slate-700/70 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className="w-full py-4 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
            >
              <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <span>Submit Civic Grievance to BBMP Jan-Samadhan</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2-Second Animated Stepper Modal Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 md:p-8 border border-emerald-500/30 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
                <Sparkles className="w-6 h-6 animate-spin text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white">AI Grievance Triaging Pipeline</h3>
              <p className="text-xs text-slate-400">
                Dialect recognition, translation, BBMP department routing & SLA registration
              </p>
            </div>

            <div className="space-y-4">
              {STEPPER_STAGES.map((step, idx) => {
                const isPassed = currentStep > idx;
                const isCurrent = currentStep === idx;
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3.5 p-3 rounded-xl transition-all ${
                      isCurrent
                        ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300'
                        : isPassed
                        ? 'bg-slate-900/60 border border-slate-800 text-slate-300'
                        : 'opacity-40 text-slate-500'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isPassed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : isCurrent ? (
                        <div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">{step.title}</h4>
                      <p className="text-xs text-slate-400">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Generated Receipt Modal */}
      {receiptTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 md:p-8 border border-emerald-500/40 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">
                    Official Grievance Receipt
                  </span>
                  <h3 className="text-xl font-extrabold text-white font-mono">
                    {receiptTicket.trackingId}
                  </h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Registered
              </span>
            </div>

            {/* Department & SLA badge row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Assigned Department</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  {receiptTicket.department}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Statutory SLA</span>
                <span className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {receiptTicket.slaHours} Hours Resolution Window
                </span>
              </div>
            </div>

            {/* Dual Translation Summary */}
            <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Original Citizen Report ({receiptTicket.originalLanguage}):
                </span>
                <p className="text-xs text-slate-200 font-mono italic">
                  "{receiptTicket.originalText}"
                </p>
              </div>
              <div className="border-t border-slate-800 pt-2">
                <span className="text-[11px] font-semibold text-emerald-400 block mb-1">
                  Municipal English Translation:
                </span>
                <p className="text-xs text-white">
                  {receiptTicket.englishTranslation}
                </p>
              </div>
            </div>

            {/* Citizen SMS Simulation Badge */}
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center gap-3 text-xs text-sky-300">
              <Phone className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <span>
                SMS confirmation sent to <strong>{receiptTicket.phone}</strong> with tracking link.
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                File Another
              </button>
              {onSwitchToDashboard && (
                <button
                  type="button"
                  onClick={() => {
                    handleResetForm();
                    onSwitchToDashboard();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <span>Track in Ward Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
